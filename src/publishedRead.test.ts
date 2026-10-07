import { describe, expect, it } from "vitest";
import {
  readArticleBySlug,
  readArticles,
  readHomePatch,
  readShopHomePatch,
  readShopProductBySlug,
  readTireModel,
  readTireModelsByType,
  readTireTypes,
  readTireVariants,
  readWheelModel,
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
      if (sql.includes("FROM tire_types_selection_vehicle_types")) return [{ value: "truck" }];
      if (sql.includes("FROM tire_types_selection_conditions")) return [{ value: "highway" }];
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
      if (sql.includes("FROM tire_models_positions")) return [{ value: "drive" }];
      if (sql.includes("FROM tire_models_features")) {
        return [{ key: "handling", title: "Управление", description: "Держит колею" }];
      }
      if (sql.includes("tire_models_rels")) return [{ image_url: "/media/gallery.jpg" }];
      if (sql.includes("FROM tire_models_application_types")) return [{ value: "long_haul" }];
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
      gallery: ["/media/gallery.jpg"],
      selectionAxles: ["drive"],
      advantages: [{ key: "handling" }],
      applicationTypes: ["long_haul"],
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

  it("reads only published models for a published tire type", async () => {
    const { db, calls } = createRecordingDb((sql) => {
      if (sql.includes("FROM tire_models_positions")) return [{ value: "steer" }];
      if (sql.includes("FROM tire_models_features")) {
        return [{ key: "safety", title: "Безопасность", description: "Стабильно" }];
      }
      if (sql.includes("tire_models_rels")) return [];
      if (sql.includes("FROM tire_models_application_types")) return [{ value: "regional" }];
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

    await expect(readTireModelsByType(db, "tbr")).resolves.toMatchObject([
      { id: "24", slug: "dsr188", tireTypeSlug: "tbr", selectionAxles: ["steer"], applicationTypes: ["regional"] },
    ]);
    expect(calls[0]).toMatchObject({ params: ["tbr"] });
    expect(calls[0].sql).toContain("FROM tire_models");
    expect(calls[0].sql).toContain("JOIN tire_types");
    expect(calls[0].sql).toContain("tire_models.status = 'published'");
    expect(calls[0].sql).toContain("tire_types.status = 'published'");
    expect(calls[0].sql).toContain("ORDER BY tire_models.name, tire_models.id");
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
    expect(published.calls[0].sql).toContain("home_shop_campaign_image_id");
    expect(published.calls[0].sql).toContain("home_directions_title");
    expect(published.calls[0].sql).toContain("home_expertise_title");
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
    expect(list.calls[0].sql).toContain("taxonomy.parent_id = tire_iq_articles.id");
    expect(list.calls[0].sql).toContain('ORDER BY taxonomy."order"');
    expect(list.calls[0].sql).not.toContain("taxonomy._parent_id");
    expect(missing.calls[0]).toMatchObject({ params: ["draft-article"] });
    expect(missing.calls[0].sql).toContain("status = 'published'");
    expect(missing.calls[0].sql).toContain("taxonomy.parent_id = tire_iq_articles.id");
    expect(missing.calls[0].sql).toContain('ORDER BY taxonomy."order"');
  });

  it("reads a published wheel model gallery and drops data urls", async () => {
    const { db, calls } = createRecordingDb((sql) => {
      if (sql.includes("wheel_models_rels")) {
        return [
          { image_url: "/media/wheel.jpg", image_alt: "Диск" },
          { image_url: "data:image/png;base64,abc", image_alt: "skip" },
        ];
      }
      return [
        {
          id: 3,
          name: "Forged",
          slug: "forged-1",
          short_description: "Кованый",
          full_description: "Прочный",
          series: "BIZON",
          wheel_type_slug: "forged",
          wheel_type_name: "Кованые",
          image_url: "/media/main.jpg",
          show_in_menu: true,
          menu_order: 1,
        },
      ];
    });

    await expect(readWheelModel(db, "forged", "forged-1")).resolves.toMatchObject({
      slug: "forged-1",
      descriptionLong: "<p>Прочный</p>",
      gallery: [{ url: "/media/wheel.jpg", alt: "Диск", label: "Диск" }],
    });
    expect(calls[0].sql).toContain("wheel_models.status = 'published'");
    expect(calls[0].params).toEqual(["forged", "forged-1"]);
  });

  it("reads a published shop product with html description and numeric variant price", async () => {
    const { db, calls } = createRecordingDb((sql) => {
      if (sql.includes("products_variants")) {
        return [{ id: "sku-1", sku: "SKU", price: "1200.00", price_on_request: false, available: true }];
      }
      if (sql.includes("products_rels")) return [{ image_url: "/media/product.jpg" }];
      return [
        {
          id: 8,
          name: "Вентиль",
          slug: "valve",
          short_description: "Коротко",
          full_description: "Полное описание",
          price: "900.50",
          price_on_request: false,
          available: true,
          category_slug: "valves",
          image_url: "/media/valve.jpg",
        },
      ];
    });

    await expect(readShopProductBySlug(db, "valve")).resolves.toMatchObject({
      slug: "valve",
      categorySlug: "valves",
      descriptionLong: "<p>Полное описание</p>",
      price: 900.5,
      gallery: ["/media/product.jpg"],
      variants: [{ id: "sku-1", price: 1200, priceOnRequest: false }],
    });
    expect(calls[0].sql).toContain("products.status = 'published'");
    expect(calls[0].params).toEqual(["valve"]);
  });

  it("reads shop-home wheels intro, order steps and vehicle shell", async () => {
    const { db, calls } = createRecordingDb((sql) => {
      if (sql.includes("FROM pages_shop_order_steps")) {
        return [{ title: "Выберите дизайн", description: "Посмотрите модели." }];
      }
      if (sql.includes("FROM pages_shop_catalog_tiles")) return [];
      if (sql.includes("FROM pages_shop_category_carousel")) return [];
      if (sql.includes("FROM pages_shop_vehicles_slides")) return [];
      return [
        {
          id: 2,
          seo_seo_title: "",
          seo_seo_description: "",
          shop_hero_eyebrow: "BIZON Forged",
          shop_hero_title: "Диски для твоего зверя",
          shop_hero_lead: "",
          shop_hero_cta_label: "Выбрать диски",
          shop_hero_cta_href: "#wheels",
          shop_hero_image_alt: "",
          shop_wheels_intro_kicker: "BIZON Forged",
          shop_wheels_intro_title: "Выберите свой дизайн",
          shop_wheels_intro_lead: "Под заказ",
          shop_vehicles_title: "Созданы менять характер",
          shop_vehicles_cta_label: "Выбрать диски",
          shop_vehicles_cta_href: "#wheels",
        },
      ];
    });

    await expect(readShopHomePatch(db)).resolves.toMatchObject({
      hero: { title: "Диски для твоего зверя", cta: { label: "Выбрать диски", href: "#wheels" } },
      wheelsIntro: { kicker: "BIZON Forged", title: "Выберите свой дизайн" },
      orderSteps: [{ title: "Выберите дизайн", description: "Посмотрите модели." }],
      vehicles: { title: "Созданы менять характер" },
    });
    expect(calls[0].sql).toContain("shop_wheels_intro_title");
    expect(calls.some((call) => call.sql.includes("pages_shop_order_steps"))).toBe(true);
  });

  it("reads Shop page catalog tiles linked to current published category slugs", async () => {
    const { db, calls } = createRecordingDb((sql) => {
      if (sql.includes("FROM pages_shop_catalog_tiles")) return [{
        category_id: 8,
        category_slug: "outdoor-current",
        title: "Путешествия",
        visible: true,
        sort_order: 1,
        icon_url: "/media/icon.png",
        image_url: "/media/tile.png",
        carousel_image_url: "/media/slide.png",
        carousel_visible: true,
        icon_alt: "Иконка",
        image_alt: "Плитка",
      }];
      if (sql.includes("FROM pages_shop_category_carousel") || sql.includes("FROM pages_shop_vehicles_slides") || sql.includes("FROM pages_shop_order_steps")) return [];
      return [{
        id: 3,
        shop_catalog_eyebrow: "Shop",
        shop_catalog_title: "Каталог",
        shop_catalog_lead: "Выберите товары",
        shop_catalog_section_title: "Направления",
      }];
    });

    await expect(readShopHomePatch(db)).resolves.toMatchObject({
      catalog: {
        copy: { title: "Каталог" },
        tiles: [{
          categoryId: "8",
          categorySlug: "outdoor-current",
          visible: true,
          carouselVisible: true,
          carouselImageUrl: "/media/slide.png",
        }],
      },
    });
    const tileQuery = calls.find((call) => call.sql.includes("FROM pages_shop_catalog_tiles"));
    expect(tileQuery?.sql).toContain("categories.status = 'published'");
    expect(tileQuery?.sql).toContain("categories.slug AS category_slug");
  });
});
