import { describe, expect, it, vi } from "vitest";
import { AdminClientError } from "./errors";
import { publishedSnapshotReads, withPublishedSnapshotFallback } from "./publishedSnapshotAdmin";
import type { AdminClient } from "./adminClient";

const revision = `sha256:${"a".repeat(64)}`;

const snapshot = {
  schema: 1,
  revision,
  content: {
    home: { hero: { title: "Главная из снимка" } },
    shopHome: null,
    stubs: {
      about: { hero: { title: "О компании из снимка" }, sections: [{ id: "one", heading: "Раздел", body: "Текст" }] },
      contact: { hero: { title: "Контакты" }, siteProfile: { legalSummary: "Реквизиты оператора.", priceNotice: "Цены ориентировочные.", madeToOrderNotice: "Под заказ.", requisites: [{ id: "inn", label: "ИНН", value: "000" }] } },
    },
    articles: [{ slug: "story", title: "Материал", excerpt: "Кратко", content: "Текст материала" }],
    tires: {
      types: [{ name: "Магистральные", slug: "tbr", description: "Для трассы", imageUrl: "https://cdn.example/tbr.jpg" }],
      models: [[{
        model: { id: "model-1", name: "DSR 158", slug: "dsr158", tireTypeSlug: "tbr", imageUrl: "https://cdn.example/dsr.jpg", descriptionShort: "Коротко" },
        variants: [{ id: "size-1", size: "315/80R22.5", priceOnRequest: true }],
      }]],
    },
    wheels: { types: [], byType: [] },
    shop: { categories: [], products: [] },
  },
};

describe("published snapshot admin", () => {
  it("reads published pages and tire directions from the snapshot", async () => {
    const reads = publishedSnapshotReads(snapshot);
    const pages = await reads.listPages!();
    const about = pages.find((page) => page.id === "about");
    expect(about?.draft.id === "about" ? about.draft.hero.title : "").toBe("О компании из снимка");
    const contact = await reads.getPage!("contact");
    expect(contact.draft.id === "contact" ? contact.draft.siteProfile?.legalSummary : "").toBe("Реквизиты оператора.");
    expect(contact.draft.id === "contact" ? contact.draft.siteProfile?.priceNotice : "").toBe("Цены ориентировочные.");
    expect(await reads.listTireDirections!()).toMatchObject([
      { id: "tbr", name: "Магистральные", status: "on_site", imageAssetId: "https://cdn.example/tbr.jpg" },
    ]);
    expect(await reads.listTireModels!()).toMatchObject([
      { id: "model-1", name: "DSR 158", directionName: "Магистральные", sizeCount: 1 },
    ]);
    expect(await reads.storageNotice!()).toContain("опубликованный снимок");
  });

  it("uses the snapshot only when the admin API cannot answer", async () => {
    const remote = {
      getSession: vi.fn().mockRejectedValue(new AdminClientError("network")),
      listTireDirections: vi.fn().mockRejectedValue(new AdminClientError("invalid_response")),
      listPages: vi.fn().mockRejectedValue(new AdminClientError("unauthorized")),
    };
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: async () => snapshot,
    }));
    const client = withPublishedSnapshotFallback(remote as unknown as AdminClient, "https://site.example/content-snapshot.json");

    await expect(client.getSession()).resolves.toMatchObject({ login: "снимок", role: "admin" });
    await expect(client.listTireDirections()).resolves.toMatchObject([{ name: "Магистральные" }]);
    await expect(client.listPages()).rejects.toMatchObject({ code: "unauthorized" });
    vi.unstubAllGlobals();
  });
});
