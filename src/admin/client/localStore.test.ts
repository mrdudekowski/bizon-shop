import { describe, expect, it } from "vitest";

import { AdminClientError } from "./errors";
import { createLocalAdminClient, type AdminStorage } from "./localStore";
import type { AdminUser, TireModelDraft } from "@/admin/domain/types";

function memory(initialValue: string | null = null): AdminStorage {
  let value = initialValue;
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

  it("does not include retired selection entry fields in the Home page draft", async () => {
    const client = createLocalAdminClient(memory());
    const page = await client.getPage("home");

    expect("selectionEntry" in page.draft).toBe(false);
    expect("resume" in page.draft).toBe(false);
  });

  it("removes retired selection entry from already saved local page snapshots", async () => {
    const storage = memory();
    const client = createLocalAdminClient(storage);
    await client.getPage("home");
    const state = JSON.parse(storage.read() ?? "{}") as {
      pages: { id: string; draft: Record<string, unknown>; savedDraft: Record<string, unknown> | null; publishedSnapshot: Record<string, unknown> | null }[];
    };
    const home = state.pages.find((page) => page.id === "home");
    const legacySection = { title: "Старый подбор" };
    if (home) {
      home.draft.selectionEntry = legacySection;
      home.draft.resume = legacySection;
      if (home.savedDraft) home.savedDraft.selectionEntry = legacySection;
      if (home.savedDraft) home.savedDraft.resume = legacySection;
      if (home.publishedSnapshot) home.publishedSnapshot.selectionEntry = legacySection;
      if (home.publishedSnapshot) home.publishedSnapshot.resume = legacySection;
    }
    storage.write(JSON.stringify(state));

    const migrated = await createLocalAdminClient(storage).getPage("home");
    expect("selectionEntry" in migrated.draft).toBe(false);
    expect("resume" in migrated.draft).toBe(false);
    expect("selectionEntry" in (migrated.savedDraft ?? {})).toBe(false);
    expect("resume" in (migrated.savedDraft ?? {})).toBe(false);
    expect("selectionEntry" in (migrated.publishedSnapshot ?? {})).toBe(false);
    expect("resume" in (migrated.publishedSnapshot ?? {})).toBe(false);
  });

  it("seeds the Shop page with editable catalog copy and empty tile presentation", async () => {
    const client = createLocalAdminClient(memory());
    const page = await client.getPage("shop-home");

    expect(page.draft).toMatchObject({
      catalog: {
        copy: {
          eyebrow: "BIZON Shop",
          title: "Движение продолжается вне автомобиля",
          lead: "Категории BIZON Shop — диски отдельно, товары по направлениям.",
          sectionTitle: "Выберите направление",
        },
        tiles: [],
      },
    });
  });

  it("unlinks a used file from local drafts before deleting it", async () => {
    const client = createLocalAdminClient(memory());
    const asset = await client.createAsset({ name: "tire.png", mimeType: "image/png", dataUrl: "data:image/png,x" });
    const created = await client.createTireModel({ name: "LH01", directionId: "dir-long-haul" });
    const ready = publishable(created.draft);
    ready.mainImage = { ...ready.mainImage!, assetId: asset.id };
    await client.saveTireModel(created.id, ready);
    await client.deleteAsset(asset.id);
    const updated = await client.getTireModel(created.id);
    expect(updated.draft.mainImage?.assetId).toBeNull();
    expect(updated.savedDraft?.mainImage?.assetId).toBeNull();
    expect((await client.listAssets()).some((item) => item.id === asset.id)).toBe(false);
    const spare = await client.createAsset({ name: "spare.png", mimeType: "image/png", dataUrl: "data:image/png,y" });
    await client.deleteAsset(spare.id);
    expect((await client.listAssets()).some((item) => item.id === spare.id)).toBe(false);
  });

  it("reports local draft and published media links separately and detaches only one link", async () => {
    const client = createLocalAdminClient(memory());
    const asset = await client.createAsset({ name: "linked.png", mimeType: "image/png", dataUrl: "data:image/png,x" });
    const created = await client.createTireModel({ name: "LH02", directionId: "dir-long-haul" });
    const ready = { ...publishable(created.draft), mainImage: { ...publishable(created.draft).mainImage!, assetId: asset.id } };
    await client.saveTireModel(created.id, ready);
    await client.publishTireModel(created.id);

    const listed = (await client.listAssets()).find((item) => item.id === asset.id)!;
    expect(listed.usages?.map((usage) => usage.state)).toEqual(expect.arrayContaining(["draft-unpublished", "published-visible"]));
    const draftUsage = listed.usages!.find((usage) => usage.state === "draft-unpublished")!;
    await client.detachAssetUsage(asset.id, draftUsage.id);

    const afterDetach = (await client.listAssets()).find((item) => item.id === asset.id)!;
    expect(afterDetach.usages).toHaveLength(listed.usages!.length - 1);
    expect(afterDetach.usages?.some((usage) => usage.state === "published-visible")).toBe(true);
    expect(afterDetach.dataUrl).toBe("data:image/png,x");
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
      users: { id: string; login: string; role: string; disabled: boolean; capabilities?: string[] }[];
    };
    raw.session.login = "editor-session";
    raw.users.push({ id: "user-editor", login: "editor-session", role: "editor", disabled: false, capabilities: [] });
    storage.write(JSON.stringify(raw));
    await expect(seeded.disableUser("user-admin")).rejects.toMatchObject({ code: "forbidden" });
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
    const repairedState = JSON.parse(storage.read() ?? "") as {
      session: { capabilities?: unknown };
      users: { capabilities?: unknown }[];
    };
    expect(repairedState.session.capabilities).toEqual([]);
    expect(repairedState.users[0]?.capabilities).toEqual([]);
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
    await client.publishShopCategory(category.id);
    const product = await client.createShopProduct({ name: "Колпак", categoryId: category.id });
    await client.saveShopProduct(product.id, {
      ...product.draft,
      mainImage: image,
      priceOnRequest: false,
      variants: [{ id: "v1", color: "", size: "22.5", sku: "", priceOnRequest: true, available: true }],
    });
    await expect(client.publishShopProduct(product.id)).rejects.toMatchObject({ code: "publish_blocked" });
  });

  it("returns main image asset ids for wheel and shop product cards", async () => {
    const client = createLocalAdminClient(memory());
    const asset = await client.createAsset({ name: "card.png", mimeType: "image/png", dataUrl: "data:image/png,x" });
    const image = {
      assetId: asset.id,
      alt: "",
      focalX: 0.5,
      focalY: 0.5,
      crop: { x: 0, y: 0, width: 1, height: 1 },
    };

    const wheelType = await client.createWheelType({ name: "Кованые" });
    const wheel = await client.createWheelModel({ name: "Atlas", wheelTypeId: wheelType.id });
    await client.saveWheelModel(wheel.id, { ...wheel.draft, mainImage: image, gallery: [image] });

    const category = await client.createShopCategory({ name: "Аксессуары" });
    const product = await client.createShopProduct({ name: "Колпак", categoryId: category.id });
    await client.saveShopProduct(product.id, { ...product.draft, mainImage: image, gallery: [image] });
    const material = await client.createMaterial({ title: "Tire IQ", kind: "article" });
    await client.saveMaterial(material.id, { ...material.draft, image });

    expect((await client.listWheelModels()).find((item) => item.id === wheel.id)).toMatchObject({ imageAssetId: asset.id });
    expect((await client.getWheelModel(wheel.id)).draft.gallery).toEqual([image]);
    expect((await client.listShopProducts()).find((item) => item.id === product.id)).toMatchObject({ imageAssetId: asset.id });
    expect((await client.getShopProduct(product.id)).draft.gallery).toEqual([image]);
    expect((await client.listMaterials()).find((item) => item.id === material.id)).toMatchObject({ imageAssetId: asset.id });
  });

  it("allows the same shop size in different colors but blocks duplicate combinations", async () => {
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
    await client.publishShopCategory(category.id);
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
    await expect(client.publishShopProduct(product.id)).resolves.toMatchObject({ id: product.id });

    const published = await client.getShopProduct(product.id);
    await client.saveShopProduct(product.id, {
      ...published.draft,
      variants: [
        { id: "v1", color: "чёрный", size: "22.5", sku: "", priceOnRequest: true, available: true },
        { id: "v2", color: "чёрный", size: "22.5", sku: "", priceOnRequest: true, available: true },
      ],
    });
    await expect(client.publishShopProduct(product.id)).rejects.toMatchObject({ code: "publish_blocked" });
  });

  it("requires a published category for shop products and prevents hiding their parent", async () => {
    const client = createLocalAdminClient(memory());
    const category = await client.createShopCategory({ name: "Аксессуары" });
    await client.saveShopCategory(category.id, category.draft);
    const asset = await client.createAsset({ name: "p.png", mimeType: "image/png", dataUrl: "data:image/png,x" });
    const product = await client.createShopProduct({ name: "Очки", categoryId: category.id });
    await client.saveShopProduct(product.id, {
      ...product.draft,
      mainImage: {
        assetId: asset.id,
        alt: "",
        focalX: 0.5,
        focalY: 0.5,
        crop: { x: 0, y: 0, width: 1, height: 1 },
      },
    });

    await expect(client.publishShopProduct(product.id)).rejects.toMatchObject({ code: "category_not_published" });
    await client.publishShopCategory(category.id);
    await client.publishShopProduct(product.id);
    await expect(client.hideShopCategory(category.id)).rejects.toMatchObject({ code: "category_has_published_products" });

    const productRow = (await client.listShopProducts())[0];
    expect(productRow).toMatchObject({ status: "on_site", categoryPublished: true, isPublished: true });
  });

  function switchSession(storage: AdminStorage, login: string, role: "admin" | "editor", capabilities: AdminUser["capabilities"] = []) {
    const raw = JSON.parse(storage.read() ?? "{}") as { session: { login: string; role: string; capabilities: string[] } };
    raw.session = { login, role, capabilities };
    storage.write(JSON.stringify(raw));
    return createLocalAdminClient(storage);
  }

  async function asEditor(
    storage: AdminStorage,
    capabilities: AdminUser["capabilities"] = [],
  ): Promise<{ client: ReturnType<typeof createLocalAdminClient>; editorId: string }> {
    const admin = createLocalAdminClient(storage);
    const editor = await admin.createUser({ login: "editor", role: "editor", password: "secret-password", capabilities });
    return { client: switchSession(storage, "editor", "editor", capabilities), editorId: editor.id };
  }

  it("forbids an editor from publishing or creating models without capability", async () => {
    const storage = memory();
    const { client } = await asEditor(storage);
    await expect(client.createTireModel({ name: "LH01", directionId: "dir-long-haul" })).rejects.toMatchObject({
      code: "forbidden",
    });
    await expect(client.createTireDirection({ name: "Регион" })).rejects.toMatchObject({ code: "forbidden" });
    const page = await client.getPage("about");
    await expect(client.savePage("about", page.draft)).rejects.toMatchObject({ code: "forbidden" });
  });

  it("records editor saves into one pack and publishes only after admin approval", async () => {
    const storage = memory();
    const admin = createLocalAdminClient(storage);
    const created = await admin.createTireModel({ name: "LH01", directionId: "dir-long-haul" });
    const ready = publishable(created.draft);
    await admin.saveTireModel(created.id, ready);
    await admin.publishTireModel(created.id);

    const editor = await admin.createUser({
      login: "editor",
      role: "editor",
      password: "secret-password",
      capabilities: ["create_catalog_items"],
    });
    const asEditorClient = switchSession(storage, "editor", "editor", ["create_catalog_items"]);

    const first = await asEditorClient.saveTireModel(created.id, { ...ready, name: "LH01 a" });
    const second = await asEditorClient.saveTireModel(created.id, { ...first.savedDraft!, name: "LH01 b" });
    expect(second.publishedSnapshot?.name).toBe("LH01");
    const mine = await asEditorClient.listChangeSets();
    expect(mine).toHaveLength(1);
    expect(mine[0].entries[0].fieldChanges.some((change) => change.path === "name")).toBe(true);

    const submitted = await asEditorClient.submitChangeSet(mine[0].id);
    expect(submitted.status).toBe("pending_review");
    await expect(asEditorClient.publishChangeSet(submitted.id)).rejects.toMatchObject({ code: "forbidden" });

    const asAdmin = switchSession(storage, "admin", "admin");
    const published = await asAdmin.publishChangeSet(submitted.id);
    expect(published.status).toBe("published");
    expect((await asAdmin.getTireModel(created.id)).publishedSnapshot?.name).toBe("LH01 b");
    expect(editor.login).toBe("editor");
  });

  it("cancels a pack and restores the previous draft", async () => {
    const storage = memory();
    const admin = createLocalAdminClient(storage);
    const created = await admin.createTireModel({ name: "LH01", directionId: "dir-long-haul" });
    const ready = publishable(created.draft);
    await admin.saveTireModel(created.id, ready);
    await admin.publishTireModel(created.id);
    await admin.createUser({ login: "editor", role: "editor", password: "secret-password" });
    const editorClient = switchSession(storage, "editor", "editor");
    await editorClient.saveTireModel(created.id, { ...ready, descriptionShort: "новое" });
    const pack = (await editorClient.listChangeSets())[0];
    await editorClient.submitChangeSet(pack.id);

    const asAdmin = switchSession(storage, "admin", "admin");
    await asAdmin.cancelChangeSet(pack.id);
    const restored = await asAdmin.getTireModel(created.id);
    expect(restored.savedDraft?.descriptionShort).toBe("");
    expect(restored.publishedSnapshot?.name).toBe("LH01");
  });

  it("accepts one page entry and rejects the other back to its published snapshot", async () => {
    const storage = memory();
    const admin = createLocalAdminClient(storage);
    const delivery = await admin.getPage("delivery");
    await admin.savePage("delivery", { ...delivery.draft, seoTitle: "Доставка на сайте" });
    await admin.publishPage("delivery");
    const payment = await admin.getPage("payment");
    await admin.savePage("payment", { ...payment.draft, seoTitle: "Оплата на сайте" });
    await admin.publishPage("payment");

    await admin.createUser({
      login: "editor",
      role: "editor",
      password: "secret-password",
      capabilities: ["edit_site_pages"],
    });
    const editor = switchSession(storage, "editor", "editor", ["edit_site_pages"]);
    const deliveryDraft = await editor.getPage("delivery");
    await editor.savePage("delivery", { ...deliveryDraft.draft, seoTitle: "Новая доставка" });
    const paymentDraft = await editor.getPage("payment");
    await editor.savePage("payment", { ...paymentDraft.draft, seoTitle: "Новая оплата" });
    const pack = (await editor.listChangeSets())[0];
    const submitted = await editor.submitChangeSet(pack.id);
    const deliveryEntry = submitted.entries.find((entry) => entry.entityId === "delivery");
    const paymentEntry = submitted.entries.find((entry) => entry.entityId === "payment");
    expect(deliveryEntry).toBeTruthy();
    expect(paymentEntry).toBeTruthy();

    const asAdmin = switchSession(storage, "admin", "admin");
    const afterAccept = await asAdmin.decidePageEntry(submitted.id, deliveryEntry!.id, "accept");
    expect(afterAccept.status).toBe("pending_review");
    expect(afterAccept.entries.map((entry) => entry.entityId)).toEqual(["payment"]);

    const afterReject = await asAdmin.decidePageEntry(submitted.id, paymentEntry!.id, "reject");
    expect(afterReject.status).toBe("cancelled");
    expect(afterReject.entries).toEqual([]);

    const accepted = await asAdmin.getPage("delivery");
    expect(accepted.publishedSnapshot?.seoTitle).toBe("Новая доставка");
    expect(accepted.draft.seoTitle).toBe("Новая доставка");

    const rejected = await asAdmin.getPage("payment");
    expect(rejected.draft).toEqual(rejected.publishedSnapshot);
    expect(rejected.savedDraft).toEqual(rejected.publishedSnapshot);
    expect(rejected.publishedSnapshot?.seoTitle).toBe("Оплата на сайте");

    const warranty = await asAdmin.getPage("warranty");
    await asAdmin.savePage("warranty", { ...warranty.draft, seoTitle: "Гарантия на сайте" });
    await asAdmin.publishPage("warranty");
    const editorAgain = switchSession(storage, "editor", "editor", ["edit_site_pages"]);
    const warrantyDraft = await editorAgain.getPage("warranty");
    await editorAgain.savePage("warranty", { ...warrantyDraft.draft, seoTitle: "Новая гарантия" });
    const warrantySubmitted = await editorAgain.submitChangeSet((await editorAgain.listChangeSets())[0].id);
    const adminAgain = switchSession(storage, "admin", "admin");
    const publishedPack = await adminAgain.decidePageEntry(
      warrantySubmitted.id,
      warrantySubmitted.entries[0].id,
      "accept",
    );
    expect(publishedPack.status).toBe("published");
    expect(publishedPack.entries).toEqual([]);
    expect((await adminAgain.getPage("warranty")).publishedSnapshot?.seoTitle).toBe("Новая гарантия");
  });
});
