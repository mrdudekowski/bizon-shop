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
  readStubPatch,
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
  it("reads only published tire types without retired selector relations", async () => {
    const { db, calls } = createRecordingDb((sql) => {
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

    const types = await readTireTypes(db);
    expect(types).toMatchObject([
      { slug: "tbr", name: "TBR", imageUrl: "/media/tbr.jpg" },
    ]);
    expect(types[0]).not.toHaveProperty("vehicleTypes");
    expect(types[0]).not.toHaveProperty("conditions");
    expect(calls[0].sql).toContain("FROM tire_types");
    expect(calls[0].sql).toContain("LEFT JOIN media");
    expect(calls[0].sql).toContain("status = 'published'");
    expect(calls).toHaveLength(1);
  });

  it("returns a published model with axles and ordered advantages", async () => {
    const { db, calls } = createRecordingDb((sql) => {
      if (sql.includes("FROM tire_models_positions")) return [{ value: "drive" }];
      if (sql.includes("FROM tire_models_features")) {
        return [{ key: "handling", title: "Управление", description: "Держит колею" }];
      }
      if (sql.includes("tire_models_rels")) return [{ image_url: "/media/gallery.jpg" }];
      if (sql.includes("FROM tire_models_application_types")) return [{ value: "long_haul" }];
      if (sql.includes("cms_document_links")) return [{ url: "/media/spec.pdf", title: "Спецификация" }];
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
      documents: [{ url: "/media/spec.pdf", title: "Спецификация" }],
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
    expect(calls[0].sql).toContain("ORDER BY COALESCE(tire_models.menu_order, 0), tire_models.name, tire_models.id");
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
  it("reads the CMS hero ownership flag so explicitly cleared copy stays empty", async () => {
    const { db, calls } = createRecordingDb(() => [{
      id: 41,
      stub_hero_configured: true,
      stub_hero_eyebrow: "",
      stub_hero_title: "",
      stub_hero_lead: "",
      stub_hero_image_alt: "",
      stub_hero_image_url: null,
      seo_seo_title: null,
      seo_seo_description: null,
    }]);

    await expect(readStubPatch(db, "about")).resolves.toMatchObject({
      hero: { eyebrow: "", title: "", lead: "", imageUrl: null, imageAlt: "" },
    });
    expect(calls[0].sql).toContain("pages.stub_hero_configured");
  });

  it("returns ordered published documents for a legal page by its stable key", async () => {
    const { db, calls } = createRecordingDb((sql) => {
      if (sql.includes("cms_document_links")) return [{ url: "/media/privacy.pdf", title: "Политика PDF" }];
      return [{ id: 41, seo_seo_title: "Политика", stub_hero_title: "Конфиденциальность" }];
    });

    await expect(readStubPatch(db, "privacy-policy")).resolves.toMatchObject({
      documents: [{ url: "/media/privacy.pdf", title: "Политика PDF" }],
    });
    expect(calls.find((call) => call.sql.includes("cms_document_links"))?.params).toEqual(["page", "privacy-policy"]);
  });

  it("attaches the site profile to the contact page read only", async () => {
    const { db } = createRecordingDb((sql) => {
      if (sql.includes("FROM site_profile_channels")) return [{ id: "telegram", label: "Telegram", href: "", enabled: true }];
      if (sql.includes("FROM site_profile_requisites")) return [{ id: "inn", label: "ИНН", value: "Информация будет предоставлена позже." }];
      if (sql.includes("FROM site_profile")) return [{ phone: "+7 (421) 000-00-11", email: "", address: "", channels_note: "", legal_summary: "", price_notice: "", made_to_order_notice: "" }];
      return [{ id: 41, seo_seo_title: "Контакты" }];
    });

    await expect(readStubPatch(db, "contact")).resolves.toMatchObject({
      siteProfile: {
        phone: "+7 (421) 000-00-11",
        channels: [{ id: "telegram", href: "", enabled: true }],
        requisites: [{ id: "inn" }],
      },
    });
    await expect(readStubPatch(db, "about")).resolves.not.toHaveProperty("siteProfile");
  });

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
        home_selection_entry_title: "Старый подбор",
      },
    ]);
    const draft = createRecordingDb(() => []);

    await expect(readHomePatch(published.db)).resolves.toMatchObject({ seoTitle: "Bizon" });
    await expect(readHomePatch(published.db)).resolves.not.toHaveProperty("selectionEntry");
    await expect(readHomePatch(draft.db)).resolves.toBeNull();
    expect(published.calls[0].sql).toContain("FROM pages");
    expect(published.calls[0].sql).toContain("key = 'home'");
    expect(published.calls[0].sql).toContain("status = 'published'");
    expect(published.calls[0].sql).toContain("home_shop_campaign_image_id");
    expect(published.calls[0].sql).toContain("home_directions_title");
    expect(published.calls[0].sql).toContain("home_expertise_title");
    expect(published.calls[0].sql).not.toContain("home_selection_entry_");
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
      if (sql.includes("cms_document_links")) return [{ url: "/media/wheel-spec.pdf", title: "Паспорт диска" }];
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
      documents: [{ url: "/media/wheel-spec.pdf", title: "Паспорт диска" }],
    });
    expect(calls[0].sql).toContain("wheel_models.status = 'published'");
    expect(calls[0].params).toEqual(["forged", "forged-1"]);
    expect(calls.some((call) => call.sql.includes("cms_document_links"))).toBe(true);
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

  it("publishes the selected variant image to the public color gallery", async () => {
    const { db } = createRecordingDb((sql) => {
      if (sql.includes("FROM products_variants WHERE")) {
        return [{ id: "sku-red", sku: "RED-1", color: "Красный", size: "M", price: "1200", old_price: "1400", price_on_request: false, available: true }];
      }
      if (sql.includes("products_variants_rels")) return [{ image_url: "https://cdn.example/red.jpg" }];
      if (sql.includes("products_rels")) return [];
      return [{
        id: 8,
        name: "Чехол",
        slug: "case",
        short_description: "",
        full_description: "Текст",
        price: "1200",
        old_price: "1500",
        price_on_request: false,
        available: true,
        category_slug: "accessories",
        image_url: null,
      }];
    });

    await expect(readShopProductBySlug(db, "case")).resolves.toMatchObject({
      oldPrice: 1500,
      variants: [{ id: "sku-red", color: "Красный", oldPrice: 1400, images: ["https://cdn.example/red.jpg"] }],
    });
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

describe("published page focal positions", () => {
  it("returns homepage image positions from CMS placement metadata", async () => {
    const { db } = createRecordingDb((sql) => {
      if (sql.includes("cms_image_focal_positions")) return [
        { placement_path: "hero.image", focal_x: 0.18, focal_y: 0.73 },
        { placement_path: "expertise.image", focal_x: 0.62, focal_y: 0.31 },
      ];
      if (sql.includes("FROM pages") && sql.includes("home_hero_eyebrow")) return [{
        seo_seo_title: null,
        seo_seo_description: null,
        home_hero_eyebrow: "",
        home_hero_title: "Главная",
        home_hero_lead: "",
        home_hero_primary_cta_label: null,
        home_hero_primary_cta_href: null,
        home_hero_secondary_cta_label: null,
        home_hero_secondary_cta_href: null,
        home_hero_metric_label: "",
        home_hero_metric_text: "",
        home_hero_image_url: "/hero.webp",
        home_hero_image_alt: "",
        home_expertise_eyebrow: "",
        home_expertise_title: "",
        home_expertise_lead: "",
        home_expertise_image_url: "/expertise.webp",
        home_expertise_image_alt: "",
      }];
      return [];
    });

    await expect(readHomePatch(db)).resolves.toMatchObject({
      hero: { imageFocalX: 0.18, imageFocalY: 0.73 },
      expertise: { imageFocalX: 0.62, imageFocalY: 0.31 },
    });
  });

  it("reads persisted hero and proof positions for the public page endpoint", async () => {
    const { db } = createRecordingDb((sql) => {
      if (sql.includes("cms_image_focal_positions")) return [
        { placement_path: "hero.image", focal_x: 0.2, focal_y: 0.8 },
        { placement_path: "proof.image", focal_x: 0.3, focal_y: 0.7 },
      ];
      if (sql.includes("cms_document_links")) return [];
      if (sql.includes("pages_editorial_features") || sql.includes("pages_editorial_sections")) return [];
      return [{
        id: 41,
        stub_hero_configured: true,
        stub_hero_eyebrow: "",
        stub_hero_title: "Branding",
        stub_hero_lead: "",
        stub_hero_image_alt: "",
        stub_hero_image_url: "/branding.webp",
        editorial_configured: true,
        editorial_proof_configured: true,
        editorial_proof_title: "Proof",
        editorial_proof_text: "",
        editorial_proof_image_url: "/proof.webp",
        editorial_proof_image_alt: "",
        seo_seo_title: null,
        seo_seo_description: null,
      }];
    });

    await expect(readStubPatch(db, "branding")).resolves.toMatchObject({
      hero: { imageFocalX: 0.2, imageFocalY: 0.8 },
      proof: { imageFocalX: 0.3, imageFocalY: 0.7 },
    });
  });
});

describe("readStubPatch page form", () => {
  const respond = (sql: string) => {
    if (sql.includes("FROM page_form_fields")) return [{ id: "companyName", label: "Название компании", field_type: "text", required: true }];
    if (sql.includes("FROM page_forms")) return [{ success_message: "Спасибо" }];
    return [{ id: 41, seo_seo_title: "Поставщикам" }];
  };

  it("attaches the stored form to the supplier page only", async () => {
    const { db } = createRecordingDb(respond);
    await expect(readStubPatch(db, "become-a-supplier")).resolves.toMatchObject({
      form: { pageKey: "become-a-supplier", successMessage: "Спасибо", fields: [{ id: "companyName", type: "text", required: true }] },
    });
    await expect(readStubPatch(db, "about")).resolves.not.toHaveProperty("form");
  });

  it("returns branding and warranty defaults when no form row is stored", async () => {
    const { db } = createRecordingDb((sql) => {
      if (sql.includes("FROM page_forms")) return [];
      return [{ id: 41, seo_seo_title: "Страница" }];
    });

    await expect(readStubPatch(db, "about")).resolves.not.toHaveProperty("form");
    await expect(readStubPatch(db, "become-a-supplier")).resolves.not.toHaveProperty("form");
    await expect(readStubPatch(db, "delivery-geography")).resolves.not.toHaveProperty("form");

    const branding = await readStubPatch(db, "branding");
    const warranty = await readStubPatch(db, "warranty");
    expect(branding?.form).toEqual({
      pageKey: "branding",
      successMessage: "Спасибо! Заявка получена. Мы свяжемся с вами, чтобы обсудить брендирование.",
      fields: [
        { id: "name", label: "Имя", type: "text", required: true },
        { id: "phone", label: "Телефон", type: "tel", required: true },
        { id: "email", label: "Email", type: "email", required: false },
        { id: "comment", label: "Комментарий", type: "textarea", required: true },
      ],
    });
    expect(warranty?.form).toEqual({
      pageKey: "warranty",
      successMessage: "Спасибо! Обращение получено. Мы свяжемся с вами по гарантии и возврату.",
      fields: [
        { id: "name", label: "Имя", type: "text", required: true },
        { id: "phone", label: "Телефон", type: "tel", required: true },
        { id: "email", label: "Email", type: "email", required: false },
        { id: "problem", label: "Опишите проблему", type: "textarea", required: true },
      ],
    });
  });
});