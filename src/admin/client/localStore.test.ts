import { describe, expect, it } from "vitest";

import { AdminClientError } from "./errors";
import { createLocalAdminClient, type AdminStorage } from "./localStore";
import type { TireModelDraft } from "@/admin/domain/types";

function memory(): AdminStorage {
  let value: string | null = null;
  return {
    read: () => value,
    write: (next) => {
      value = next;
    },
  };
}

function publishable(draft: TireModelDraft): TireModelDraft {
  return {
    ...draft,
    mainImage: {
      assetId: "asset-1",
      alt: "шина",
      focalX: 0.5,
      focalY: 0.5,
      crop: { x: 0, y: 0, width: 1, height: 1 },
    },
    sizes: [{ id: "size-1", size: "315/80R22.5", priceOnRequest: true, available: true }],
  };
}

describe("createLocalAdminClient", () => {
  it("creates an unpublished model and rejects a duplicate slug", async () => {
    const client = createLocalAdminClient(memory());
    const created = await client.createTireModel({ name: "Bizon Long Haul", directionId: "dir-long-haul" });
    expect(created.draft.slug).toBe("bizon-long-haul");
    expect(created.publishedSnapshot).toBeNull();
    expect(created.slugLocked).toBe(false);
    await expect(
      client.createTireModel({ name: "Bizon Long Haul", directionId: "dir-long-haul" }),
    ).rejects.toMatchObject({ code: "slug_taken" });
  });

  it("saves a draft without publishing", async () => {
    const client = createLocalAdminClient(memory());
    const created = await client.createTireModel({ name: "LH01", directionId: "dir-long-haul" });
    const saved = await client.saveTireModel(created.id, { ...created.draft, name: "LH01 saved" });
    expect(saved.savedDraft?.name).toBe("LH01 saved");
    expect(saved.publishedSnapshot).toBeNull();
  });

  it("refuses to publish an unsaved draft", async () => {
    const client = createLocalAdminClient(memory());
    const created = await client.createTireModel({ name: "LH01", directionId: "dir-long-haul" });
    await expect(client.publishTireModel(created.id)).rejects.toBeInstanceOf(AdminClientError);
    await expect(client.publishTireModel(created.id)).rejects.toMatchObject({ code: "unsaved" });
  });

  it("blocks publish until the card can render", async () => {
    const client = createLocalAdminClient(memory());
    const created = await client.createTireModel({ name: "LH01", directionId: "dir-long-haul" });
    await client.saveTireModel(created.id, { ...created.draft, name: " " });
    await expect(client.publishTireModel(created.id)).rejects.toMatchObject({ code: "publish_blocked" });
  });

  it("publishes the saved draft and freezes the slug", async () => {
    const client = createLocalAdminClient(memory());
    const created = await client.createTireModel({ name: "LH01", directionId: "dir-long-haul" });
    const ready = publishable(created.draft);
    await client.saveTireModel(created.id, ready);
    const published = await client.publishTireModel(created.id);
    expect(published.publishedSnapshot).toEqual(ready);
    expect(published.slugLocked).toBe(true);

    await client.saveTireModel(created.id, { ...ready, name: "LH01 next" });
    const afterSave = await client.getTireModel(created.id);
    expect(afterSave.publishedSnapshot).toEqual(ready);

    await expect(client.saveTireModel(created.id, { ...ready, slug: "other-slug" })).rejects.toMatchObject({
      code: "invalid_slug",
    });
    expect((await client.getTireModel(created.id)).draft.slug).toBe("lh01");
  });

  it("deletes only a never-published draft and hides a published model", async () => {
    const client = createLocalAdminClient(memory());
    const draft = await client.createTireModel({ name: "Draft", directionId: "dir-long-haul" });
    await client.deleteTireModel(draft.id);
    await expect(client.getTireModel(draft.id)).rejects.toThrow("not_found");

    const created = await client.createTireModel({ name: "Live", directionId: "dir-long-haul" });
    await client.saveTireModel(created.id, publishable(created.draft));
    await client.publishTireModel(created.id);
    await expect(client.deleteTireModel(created.id)).rejects.toMatchObject({ code: "publish_blocked" });
    await client.hideTireModel(created.id);
    const listed = await client.listTireModels();
    expect(listed.find((item) => item.id === created.id)?.status).toBe("hidden");
  });

  it("publishes an empty page and resets the snapshot", async () => {
    const client = createLocalAdminClient(memory());
    const published = await client.publishPage("about");
    expect(published.publishedSnapshot?.hero.title).toBe("");
    const reset = await client.resetPage("about");
    expect(reset.publishedSnapshot).toBeNull();
  });

  it("refuses to delete a used file", async () => {
    const client = createLocalAdminClient(memory());
    const asset = await client.createAsset({ name: "tire.png", mimeType: "image/png", dataUrl: "data:image/png,x" });
    const created = await client.createTireModel({ name: "LH01", directionId: "dir-long-haul" });
    const ready = publishable(created.draft);
    ready.mainImage = { ...ready.mainImage!, assetId: asset.id };
    await client.saveTireModel(created.id, ready);
    await expect(client.deleteAsset(asset.id)).rejects.toMatchObject({ code: "media_in_use" });
    const spare = await client.createAsset({ name: "spare.png", mimeType: "image/png", dataUrl: "data:image/png,y" });
    await client.deleteAsset(spare.id);
    expect((await client.listAssets()).some((item) => item.id === spare.id)).toBe(false);
  });

  it("does not disable the current user or the last admin", async () => {
    const client = createLocalAdminClient(memory());
    const users = await client.listUsers();
    const admin = users.find((user) => user.login === "admin");
    await expect(client.disableUser(admin?.id ?? "")).rejects.toMatchObject({ code: "cannot_disable_self" });

    const storage = memory();
    const seeded = createLocalAdminClient(storage);
    await seeded.listUsers();
    const raw = JSON.parse(storage.read() ?? "{}") as {
      session: { login: string };
      users: { id: string; login: string; role: string; disabled: boolean }[];
    };
    raw.session.login = "editor-session";
    raw.users.push({ id: "user-editor", login: "editor-session", role: "editor", disabled: false });
    storage.write(JSON.stringify(raw));
    await expect(seeded.disableUser("user-admin")).rejects.toMatchObject({ code: "last_admin" });
  });

  it("discards a user password", async () => {
    const storage = memory();
    const client = createLocalAdminClient(storage);
    await client.createUser({ login: "editor1", role: "editor", password: "secret-password" });
    expect(storage.read()).not.toContain("secret-password");
  });

  it("does not store a password and repairs corrupt storage", async () => {
    const storage = memory();
    const client = createLocalAdminClient(storage);
    await client.createTireModel({ name: "LH01", directionId: "dir-long-haul" });
    expect(storage.read()).not.toContain("password");

    storage.write("{");
    const repaired = createLocalAdminClient(storage);
    await repaired.listTireDirections();
    expect(JSON.parse(storage.read() ?? "")).toMatchObject({
      directions: [{ id: "dir-long-haul" }],
    });
  });

  it("publishes a tire direction without a cover image", async () => {
    const client = createLocalAdminClient(memory());
    const created = await client.createTireDirection({ name: "Регион" });
    await client.saveTireDirection(created.id, created.draft);
    const published = await client.publishTireDirection(created.id);
    expect(published.publishedSnapshot?.name).toBe("Регион");
  });

  it("rejects removing the last admin role", async () => {
    const client = createLocalAdminClient(memory());
    const [admin] = await client.listUsers();
    await expect(client.setUserRole(admin.id, "editor")).rejects.toMatchObject({ code: "last_admin" });
  });

  it("reports a repaired store once", async () => {
    const storage = memory();
    storage.write("{");
    const client = createLocalAdminClient(storage);
    expect(await client.storageNotice()).toBe("Хранилище повреждено, восстановлены стартовые данные");
    expect(await client.storageNotice()).toBeNull();
  });

  it("blocks tire publish on duplicate size", async () => {
    const client = createLocalAdminClient(memory());
    const created = await client.createTireModel({ name: "DupSize", directionId: "dir-long-haul" });
    const ready = publishable(created.draft);
    ready.sizes = [
      { id: "size-1", size: "315/80R22.5", priceOnRequest: true, available: true },
      { id: "size-2", size: "315/80R22.5", priceOnRequest: true, available: true },
    ];
    await client.saveTireModel(created.id, ready);
    await expect(client.publishTireModel(created.id)).rejects.toMatchObject({ code: "publish_blocked" });
  });

  it("frees the slug after deleting a never-published tire model", async () => {
    const client = createLocalAdminClient(memory());
    const draft = await client.createTireModel({ name: "Reusable", directionId: "dir-long-haul" });
    await client.deleteTireModel(draft.id);
    const again = await client.createTireModel({ name: "Reusable", directionId: "dir-long-haul" });
    expect(again.draft.slug).toBe("reusable");
  });

  it("publishes a tire model with an empty sku", async () => {
    const client = createLocalAdminClient(memory());
    const created = await client.createTireModel({ name: "NoSku", directionId: "dir-long-haul" });
    const ready = publishable(created.draft);
    ready.sizes = [{ id: "size-1", size: "315/80R22.5", priceOnRequest: true, available: true, sku: "" }];
    await client.saveTireModel(created.id, ready);
    const published = await client.publishTireModel(created.id);
    expect(published.publishedSnapshot?.sizes[0]?.sku).toBe("");
  });

  it("blocks shop publish when a variant has no price choice", async () => {
    const client = createLocalAdminClient(memory());
    const category = await client.createShopCategory({ name: "Аксессуары" });
    const asset = await client.createAsset({ name: "p.png", mimeType: "image/png", dataUrl: "data:image/png,x" });
    await client.saveShopCategory(category.id, {
      ...category.draft,
      mainImage: {
        assetId: asset.id,
        alt: "",
        focalX: 0.5,
        focalY: 0.5,
        crop: { x: 0, y: 0, width: 1, height: 1 },
      },
    });
    await client.publishShopCategory(category.id);
    const product = await client.createShopProduct({ name: "Колпак", categoryId: category.id });
    await client.saveShopProduct(product.id, {
      ...product.draft,
      mainImage: {
        assetId: asset.id,
        alt: "",
        focalX: 0.5,
        focalY: 0.5,
        crop: { x: 0, y: 0, width: 1, height: 1 },
      },
      variants: [
        {
          id: "v1",
          color: "чёрный",
          size: "22.5",
          sku: "",
          priceOnRequest: false,
          available: true,
        },
      ],
    });
    await expect(client.publishShopProduct(product.id)).rejects.toMatchObject({ code: "publish_blocked" });
  });

  it("rejects saving a second wheel type with the same slug", async () => {
    const client = createLocalAdminClient(memory());
    const first = await client.createWheelType({ name: "Кованые" });
    await client.saveWheelType(first.id, first.draft);
    const second = await client.createWheelType({ name: "Литые другие" });
    await expect(client.saveWheelType(second.id, { ...second.draft, slug: first.draft.slug })).rejects.toMatchObject({
      code: "slug_taken",
    });
  });

  it("keeps the seeded direction unlocked until publish", async () => {
    const client = createLocalAdminClient(memory());
    const direction = await client.getTireDirection("dir-long-haul");
    expect(direction.slugLocked).toBe(false);
  });

  it("blocks publish when the parent record is missing", async () => {
    const client = createLocalAdminClient(memory());
    const created = await client.createTireModel({ name: "Orphan", directionId: "missing-direction" });
    await client.saveTireModel(created.id, publishable({ ...created.draft, directionId: "missing-direction" }));
    await expect(client.publishTireModel(created.id)).rejects.toMatchObject({ code: "publish_blocked" });
  });

  it("blocks deleting a direction that still has a model", async () => {
    const client = createLocalAdminClient(memory());
    await client.createTireModel({ name: "Still here", directionId: "dir-long-haul" });
    await expect(client.deleteTireDirection("dir-long-haul")).rejects.toMatchObject({ code: "publish_blocked" });
    expect(await client.getTireDirection("dir-long-haul")).toMatchObject({ id: "dir-long-haul" });
  });

  it("blocks shop publish without a card price", async () => {
    const client = createLocalAdminClient(memory());
    const category = await client.createShopCategory({ name: "Аксессуары" });
    const asset = await client.createAsset({ name: "p.png", mimeType: "image/png", dataUrl: "data:image/png,x" });
    const image = {
      assetId: asset.id,
      alt: "",
      focalX: 0.5,
      focalY: 0.5,
      crop: { x: 0, y: 0, width: 1, height: 1 },
    };
    await client.saveShopCategory(category.id, { ...category.draft, mainImage: image });
    const product = await client.createShopProduct({ name: "Колпак", categoryId: category.id });
    await client.saveShopProduct(product.id, {
      ...product.draft,
      mainImage: image,
      priceOnRequest: false,
      variants: [{ id: "v1", color: "", size: "22.5", sku: "", priceOnRequest: true, available: true }],
    });
    await expect(client.publishShopProduct(product.id)).rejects.toMatchObject({ code: "publish_blocked" });
  });

  it("treats two colors of the same shop size as a size conflict", async () => {
    const client = createLocalAdminClient(memory());
    const category = await client.createShopCategory({ name: "Аксессуары" });
    const asset = await client.createAsset({ name: "p.png", mimeType: "image/png", dataUrl: "data:image/png,x" });
    const image = {
      assetId: asset.id,
      alt: "",
      focalX: 0.5,
      focalY: 0.5,
      crop: { x: 0, y: 0, width: 1, height: 1 },
    };
    await client.saveShopCategory(category.id, { ...category.draft, mainImage: image });
    const product = await client.createShopProduct({ name: "Колпак", categoryId: category.id });
    await client.saveShopProduct(product.id, {
      ...product.draft,
      mainImage: image,
      priceOnRequest: true,
      variants: [
        { id: "v1", color: "чёрный", size: "22.5", sku: "", priceOnRequest: true, available: true },
        { id: "v2", color: "серебро", size: "22.5", sku: "", priceOnRequest: true, available: true },
      ],
    });
    await expect(client.publishShopProduct(product.id)).rejects.toMatchObject({ code: "publish_blocked" });
  });
});
