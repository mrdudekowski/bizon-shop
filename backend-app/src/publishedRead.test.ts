import { describe, expect, it } from "vitest";
import {
  readArticleBySlug,
  readArticles,
  readHomePatch,
  readTireModel,
  readTireTypes,
  readTireVariants,
} from "./publishedRead";

type QueryCall = { sql: string; params?: unknown[] };

function createRecordingDb(respond: (sql: string, params?: unknown[]) => Record<string, unknown>[]) {
  const calls: QueryCall[] = [];

  return {
    calls,
    db: {
      async query(sql: string, params?: unknown[]) {
        calls.push({ sql, params });
        return respond(sql, params);
      },
    },
  };
}

describe("published catalog readers", () => {
  it("reads only published tire types with their selection relations", async () => {
    const { db, calls } = createRecordingDb((sql) => {
      if (sql.includes("FROM tire_types_selection_vehicle_types")) return [{ vehicle_type: "truck" }];
      if (sql.includes("FROM tire_types_selection_conditions")) return [{ condition: "highway" }];
      return [
        {
          id: 1,
          name: "TBR",
          slug: "tbr",
          description: "Грузовые",
          short_description: "TBR",
          sort_order: 1,
          show_in_menu: true,
          image_url: "/media/tbr.jpg",
        },
      ];
    });

    await expect(readTireTypes(db)).resolves.toMatchObject([
      { slug: "tbr", vehicleTypes: ["truck"], conditions: ["highway"] },
    ]);
    expect(calls[0].sql).toContain("FROM tire_types");
    expect(calls[0].sql).toContain("LEFT JOIN media");
    expect(calls[0].sql).toContain("status = 'published'");
    expect(calls[1].sql).toContain("parent_id");
    expect(calls[2].sql).toContain("parent_id");
  });

  it("returns a published model with axles and ordered advantages", async () => {
    const { db, calls } = createRecordingDb((sql) => {
      if (sql.includes("FROM tire_models_positions")) return [{ position: "drive" }];
      if (sql.includes("FROM tire_models_features")) {
        return [{ key: "handling", title: "Управление", description: "Держит колею" }];
      }
      return [
        {
          id: 24,
          name: "DSR188",
          slug: "dsr188",
          short_description: "Магистраль",
          full_description: null,
          series: "BIZON",
          tread_type: "rib",
          tire_type_slug: "tbr",
          tire_type_name: "TBR",
          image_url: "/media/dsr188.jpg",
        },
      ];
    });

    await expect(readTireModel(db, "tbr", "dsr188")).resolves.toMatchObject({
      id: "24",
      tireTypeSlug: "tbr",
      gallery: [],
      selectionAxles: ["drive"],
      advantages: [{ key: "handling" }],
    });
    expect(calls[0]).toMatchObject({ params: ["tbr", "dsr188"] });
    expect(calls[0].sql).toContain("FROM tire_models");
    expect(calls[0].sql).toContain("JOIN tire_types");
    expect(calls[0].sql).toContain("LEFT JOIN media");
    expect(calls[0].sql).toContain("tire_models.status = 'published'");
    expect(calls[0].sql).toContain("tire_types.status = 'published'");
    expect(calls[2].sql).toContain("_parent_id");
    expect(calls[2].sql).toContain("ORDER BY _order");
  });

  it("returns null for a missing draft-slug model", async () => {
    const { db, calls } = createRecordingDb(() => []);

    await expect(readTireModel(db, "tbr", "draft-model")).resolves.toBeNull();
    expect(calls).toHaveLength(1);
    expect(calls[0].sql).toContain("tire_models.status = 'published'");
    expect(calls[0]).toMatchObject({ params: ["tbr", "draft-model"] });
  });

  it("reads only published variants in canonical order", async () => {
    const { db, calls } = createRecordingDb(() => [
      { id: 7, size: "315/80R22.5", price: 100, price_on_request: false, available: true },
    ]);

    await expect(readTireVariants(db, 24)).resolves.toMatchObject([{ id: "7" }]);
    expect(calls[0]).toMatchObject({ params: [24] });
    expect(calls[0].sql).toContain("FROM tire_variants");
    expect(calls[0].sql).toContain("status = 'published'");
    expect(calls[0].sql).toContain("ORDER BY sort_order, id");
  });
});

describe("published content readers", () => {
  it("reads a published home patch and excludes drafts", async () => {
    const published = createRecordingDb(() => [
      {
        seo_seo_title: "Bizon",
        seo_seo_description: null,
        home_hero_eyebrow: null,
        home_hero_title: "Шины",
        home_hero_lead: null,
        home_hero_primary_cta_label: null,
        home_hero_primary_cta_href: null,
        home_hero_secondary_cta_label: null,
        home_hero_secondary_cta_href: null,
        home_hero_metric_label: null,
        home_hero_metric_text: null,
      },
    ]);
    const draft = createRecordingDb(() => []);

    await expect(readHomePatch(published.db)).resolves.toMatchObject({ seoTitle: "Bizon" });
    await expect(readHomePatch(draft.db)).resolves.toBeNull();
    expect(published.calls[0].sql).toContain("FROM pages");
    expect(published.calls[0].sql).toContain("key = 'home'");
    expect(published.calls[0].sql).toContain("status = 'published'");
  });

  it("reads published articles and returns null for an absent draft slug", async () => {
    const publishedAt = new Date("2026-01-01T00:00:00.000Z");
    const list = createRecordingDb(() => [
      {
        title: "Тест",
        slug: "test",
        excerpt: "Кратко",
        content: "Текст",
        published_at: publishedAt,
        image_url: "/media/test.jpg",
        show_in_menu: true,
        menu_order: 1,
      },
    ]);
    const missing = createRecordingDb(() => []);

    await expect(readArticles(list.db)).resolves.toMatchObject([{ slug: "test" }]);
    await expect(readArticleBySlug(missing.db, "draft-article")).resolves.toBeNull();
    expect(list.calls[0].sql).toContain("FROM tire_iq_articles");
    expect(list.calls[0].sql).toContain("LEFT JOIN media");
    expect(list.calls[0].sql).toContain("status = 'published'");
    expect(missing.calls[0]).toMatchObject({ params: ["draft-article"] });
    expect(missing.calls[0].sql).toContain("status = 'published'");
  });
});
