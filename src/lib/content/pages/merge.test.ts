import { describe, expect, it } from "vitest";

import { HOME_PAGE_DEFAULTS } from "./defaults/home";
import { SHOP_HOME_PAGE_DEFAULTS } from "./defaults/shopHome";
import { mergeHomeContent, mergeShopHomeContent } from "./merge";

describe("mergeHomeContent", () => {
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

  it("rewrites published selection CTAs to the catalog", () => {
    const merged = mergeHomeContent(HOME_PAGE_DEFAULTS, {
      hero: {
        primaryCta: { label: "Начать подбор", href: "/#solutions" },
      },
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
});

describe("mergeShopHomeContent", () => {
  it("uses CMS order steps when provided", () => {
    const merged = mergeShopHomeContent(SHOP_HOME_PAGE_DEFAULTS, {
      orderSteps: [{ title: "A", description: "B" }],
    });
    expect(merged.orderSteps).toEqual([{ title: "A", description: "B" }]);
    expect(merged.preferredWheelSlugs).toEqual(
      SHOP_HOME_PAGE_DEFAULTS.preferredWheelSlugs,
    );
  });

  it("falls back to default slides when CMS carousel empty", () => {
    const merged = mergeShopHomeContent(SHOP_HOME_PAGE_DEFAULTS, {
      categoryCarousel: [],
    });
    expect(merged.categoryCarousel).toEqual(
      SHOP_HOME_PAGE_DEFAULTS.categoryCarousel,
    );
  });

  it("uses CMS wheels intro when provided", () => {
    const merged = mergeShopHomeContent(SHOP_HOME_PAGE_DEFAULTS, {
      wheelsIntro: { title: "Новый ввод" },
    });
    expect(merged.wheelsIntro.title).toBe("Новый ввод");
    expect(merged.wheelsIntro.lead).toBe(SHOP_HOME_PAGE_DEFAULTS.wheelsIntro.lead);
  });
});
