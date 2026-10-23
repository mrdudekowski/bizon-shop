import { describe, expect, it } from "vitest";

import { HOME_PAGE_DEFAULTS } from "./defaults/home";
import { SHOP_HOME_PAGE_DEFAULTS } from "./defaults/shopHome";
import { stubPageDefaults } from "./defaults/stub";
import { mergeHomeContent, mergeShopHomeContent, mergeStubContent } from "./merge";

describe("mergeHomeContent", () => {
  it("preserves explicitly empty SEO content instead of restoring defaults", () => {
    const merged = mergeHomeContent(HOME_PAGE_DEFAULTS, {
      seoTitle: "",
      seoDescription: "",
    });

    expect(merged.seoTitle).toBe("");
    expect(merged.seoDescription).toBe("");
  });

  it("does not expose the retired selection entry as active homepage content", () => {
    expect("selectionEntry" in HOME_PAGE_DEFAULTS).toBe(false);
    expect("selectionEntry" in mergeHomeContent(HOME_PAGE_DEFAULTS, {})).toBe(false);
    expect("resume" in HOME_PAGE_DEFAULTS).toBe(false);
    expect("resume" in mergeHomeContent(HOME_PAGE_DEFAULTS, {})).toBe(false);
  });

  it("keeps defaults when patch is empty", () => {
    expect(mergeHomeContent(HOME_PAGE_DEFAULTS, {})).toEqual(HOME_PAGE_DEFAULTS);
  });

  it("overrides hero title and CTA from CMS", () => {
    const merged = mergeHomeContent(HOME_PAGE_DEFAULTS, {
      hero: {
        title: "Новый заголовок",
        primaryCta: { label: "Старт", href: "/models" },
      },
    });
    expect(merged.hero.title).toBe("Новый заголовок");
    expect(merged.hero.primaryCta.label).toBe("Старт");
    expect(merged.hero.primaryCta.href).toBe("/models");
    expect(merged.hero.imageUrl).toBe(HOME_PAGE_DEFAULTS.hero.imageUrl);
    expect(merged.hero.secondaryCta).toEqual(HOME_PAGE_DEFAULTS.hero.secondaryCta);
  });

  it("removes retired selection wording when mapping its route to the catalog", () => {
    const merged = mergeHomeContent(HOME_PAGE_DEFAULTS, {
      hero: {
        primaryCta: { label: "Начать подбор", href: "/#solutions" },
      },
    });
    expect(merged.hero.primaryCta).toEqual({ label: "Открыть каталог", href: "/models" });
  });

  it("removes retired selection wording from saved CMS CTAs that use the old route", () => {
    const merged = mergeHomeContent(HOME_PAGE_DEFAULTS, {
      hero: { primaryCta: { label: "Подобрать шины", href: "/selection" } },
    });

    expect(merged.hero.primaryCta).toEqual({ label: "Открыть каталог", href: "/models" });
  });

  it("overrides hero imageUrl from CMS and keeps the default file when CMS has none", () => {
    expect(mergeHomeContent(HOME_PAGE_DEFAULTS, { hero: {} }).hero.imageUrl).toBe(
      HOME_PAGE_DEFAULTS.hero.imageUrl,
    );
    expect(HOME_PAGE_DEFAULTS.hero.imageUrl).toBe("/images/hero/backdrop.jpg");

    const merged = mergeHomeContent(HOME_PAGE_DEFAULTS, {
      hero: { imageUrl: "https://s3.twcstorage.ru/bucket/bizon/media/hero.jpg" },
    });
    expect(merged.hero.imageUrl).toBe("https://s3.twcstorage.ru/bucket/bizon/media/hero.jpg");
  });

  it("overrides shop campaign imageUrl from CMS", () => {
    const merged = mergeHomeContent(HOME_PAGE_DEFAULTS, {
      shopCampaign: {
        imageUrl: "https://s3.twcstorage.ru/bucket/bizon/media/uuid.png",
      },
    });
    expect(merged.shopCampaign.imageUrl).toBe("https://s3.twcstorage.ru/bucket/bizon/media/uuid.png");
  });

  it("overrides directions and expertise from CMS", () => {
    const merged = mergeHomeContent(HOME_PAGE_DEFAULTS, {
      directions: { title: "Шины под рабочую среду" },
      expertise: { title: "Экспертиза и поддержка" },
    });
    expect(merged.directions.title).toBe("Шины под рабочую среду");
    expect(merged.directions.lead).toBe(HOME_PAGE_DEFAULTS.directions.lead);
    expect(merged.expertise.title).toBe("Экспертиза и поддержка");
  });

  it("preserves the Expertise image, alt text, and CTA from CMS", () => {
    const merged = mergeHomeContent(HOME_PAGE_DEFAULTS, {
      expertise: {
        imageUrl: "https://cdn.example.test/expertise.jpg",
        imageAlt: "Измерение протектора",
        cta: { label: "Читать", href: "/tire-iq" },
      },
    });

    expect(merged.expertise.imageUrl).toBe("https://cdn.example.test/expertise.jpg");
    expect(merged.expertise.imageAlt).toBe("Измерение протектора");
    expect(merged.expertise.cta).toEqual({ label: "Читать", href: "/tire-iq" });
  });

  it("renders published branding copy, CTA, captions, and image assignments", () => {
    const merged = mergeHomeContent(HOME_PAGE_DEFAULTS, {
      branding: {
        eyebrow: "Брендирование",
        title: "Логотип на шинах",
        lead: "Под ваш автопарк.",
        cta: { label: "Оставить заявку", href: "/contact?subject=fleet" },
        beforeCaption: "До",
        afterCaption: "После",
        beforeImageUrl: "/images/before.jpg",
        beforeImageAlt: "До",
        afterImageUrl: "/images/after.jpg",
        afterImageAlt: "После",
      },
    });

    expect(merged.branding).toEqual({
      eyebrow: "Брендирование",
      title: "Логотип на шинах",
      lead: "Под ваш автопарк.",
      cta: { label: "Оставить заявку", href: "/contact?subject=fleet" },
      beforeCaption: "До",
      afterCaption: "После",
      beforeImageUrl: "/images/before.jpg",
      beforeImageAlt: "До",
      afterImageUrl: "/images/after.jpg",
      afterImageAlt: "После",
    });
  });

  it("keeps explicit empty branding copy and cleared comparison images", () => {
    const merged = mergeHomeContent(HOME_PAGE_DEFAULTS, {
      branding: {
        title: "",
        lead: "",
        beforeCaption: "",
        afterCaption: "",
        beforeImageUrl: null,
        afterImageUrl: null,
        cta: { label: "", href: "" },
      },
    });

    expect(merged.branding.title).toBe("");
    expect(merged.branding.lead).toBe("");
    expect(merged.branding.beforeImageUrl).toBeNull();
    expect(merged.branding.afterImageUrl).toBeNull();
    expect(merged.branding.cta).toEqual({ label: "", href: "" });
  });

  it("preserves explicit empty text, an empty CTA, and a cleared image", () => {
    const merged = mergeHomeContent(HOME_PAGE_DEFAULTS, {
      hero: {
        title: "",
        lead: "",
        imageUrl: null,
        primaryCta: { label: "", href: "" },
      },
    });

    expect(merged.hero.title).toBe("");
    expect(merged.hero.lead).toBe("");
    expect(merged.hero.imageUrl).toBeNull();
    expect(merged.hero.primaryCta).toEqual({ label: "", href: "" });
  });
});

describe("mergeShopHomeContent", () => {
  it("preserves explicitly empty SEO content instead of restoring defaults", () => {
    const merged = mergeShopHomeContent(SHOP_HOME_PAGE_DEFAULTS, {
      seoTitle: "",
      seoDescription: "",
    });

    expect(merged.seoTitle).toBe("");
    expect(merged.seoDescription).toBe("");
  });

  it("uses CMS order steps when provided", () => {
    const merged = mergeShopHomeContent(SHOP_HOME_PAGE_DEFAULTS, {
      orderSteps: [{ title: "A", description: "B" }],
    });
    expect(merged.orderSteps).toEqual([{ title: "A", description: "B" }]);
    expect(merged.preferredWheelSlugs).toEqual(
      SHOP_HOME_PAGE_DEFAULTS.preferredWheelSlugs,
    );
  });

  it("preserves an explicitly empty category carousel", () => {
    const merged = mergeShopHomeContent(SHOP_HOME_PAGE_DEFAULTS, {
      categoryCarousel: [],
    });
    expect(merged.categoryCarousel).toEqual([]);
  });

  it("preserves empty CMS lists and only falls back when a field is absent", () => {
    const merged = mergeShopHomeContent(SHOP_HOME_PAGE_DEFAULTS, {
      orderSteps: [],
      categoryCarousel: [],
      vehicles: { slides: [] },
    });

    expect(merged.orderSteps).toEqual([]);
    expect(merged.categoryCarousel).toEqual([]);
    expect(merged.vehicles.slides).toEqual([]);

    const legacy = mergeShopHomeContent(SHOP_HOME_PAGE_DEFAULTS, {});
    expect(legacy.orderSteps).toEqual(SHOP_HOME_PAGE_DEFAULTS.orderSteps);
    expect(legacy.categoryCarousel).toEqual(SHOP_HOME_PAGE_DEFAULTS.categoryCarousel);
    expect(legacy.vehicles.slides).toEqual(SHOP_HOME_PAGE_DEFAULTS.vehicles.slides);
  });

  it("does not restore the default Shop hero image after an explicit clear", () => {
    const merged = mergeShopHomeContent(SHOP_HOME_PAGE_DEFAULTS, {
      hero: { imageUrl: null },
    });

    expect(merged.hero.imageUrl).toBeNull();
  });

  it("uses CMS wheels intro when provided", () => {
    const merged = mergeShopHomeContent(SHOP_HOME_PAGE_DEFAULTS, {
      wheelsIntro: { title: "Новый ввод" },
    });
    expect(merged.wheelsIntro.title).toBe("Новый ввод");
    expect(merged.wheelsIntro.lead).toBe(SHOP_HOME_PAGE_DEFAULTS.wheelsIntro.lead);
  });

  it("merges Shop catalog copy and category tile configuration", () => {
    const merged = mergeShopHomeContent(SHOP_HOME_PAGE_DEFAULTS, {
      catalog: {
        copy: { title: "Каталог путешествий" },
        tiles: [{
          categoryId: "4",
          categorySlug: "outdoor",
          title: "Путешествия",
          visible: true,
          sortOrder: 2,
          carouselVisible: true,
          carouselImageUrl: "/media/outdoor.jpg",
        }],
      },
    });

    expect(merged.catalog.copy.title).toBe("Каталог путешествий");
    expect(merged.catalog.copy.lead).toBe(SHOP_HOME_PAGE_DEFAULTS.catalog.copy.lead);
    expect(merged.catalog.tiles[0]).toMatchObject({
      categoryId: "4",
      categorySlug: "outdoor",
      sortOrder: 2,
      carouselImageUrl: "/media/outdoor.jpg",
    });
  });

  it("supplies catalog page defaults for legacy Shop page patches", () => {
    const merged = mergeShopHomeContent(SHOP_HOME_PAGE_DEFAULTS, {});
    expect(merged.catalog.copy).toEqual(SHOP_HOME_PAGE_DEFAULTS.catalog.copy);
    expect(merged.catalog.tiles).toEqual([]);
  });
});

describe("mergeStubContent", () => {
  it("preserves explicitly empty SEO content instead of restoring defaults", () => {
    const defaults = stubPageDefaults("about");
    const merged = mergeStubContent(defaults, { seoTitle: "", seoDescription: "" });

    expect(merged.seoTitle).toBe("");
    expect(merged.seoDescription).toBe("");
  });
});
