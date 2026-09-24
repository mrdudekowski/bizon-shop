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
        primaryCta: { label: "Старт", href: "/#solutions" },
      },
    });
    expect(merged.hero.title).toBe("Новый заголовок");
    expect(merged.hero.primaryCta.label).toBe("Старт");
    expect(merged.hero.primaryCta.href).toBe("/#solutions");
    expect(merged.hero.imageUrl).toBe(HOME_PAGE_DEFAULTS.hero.imageUrl);
    expect(merged.hero.secondaryCta).toEqual(HOME_PAGE_DEFAULTS.hero.secondaryCta);
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
});
