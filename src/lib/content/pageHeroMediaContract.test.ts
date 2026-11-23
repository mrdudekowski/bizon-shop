import { describe, expect, it } from "vitest";
import { PAGE_HERO_MEDIA_CONTRACT, pageHeroLayoutForPage } from "./pageHeroMediaContract";

describe("public page hero media contract", () => {
  it.each([
    "branding",
    "become-a-supplier",
    "shop-become-a-supplier",
    "delivery",
    "shop-delivery",
    "payment",
    "shop-payment",
    "warranty",
    "shop-warranty",
  ])("uses banner media on %s", (pageKey) => {
    expect(pageHeroLayoutForPage(pageKey)).toBe("banner");
  });

  it.each(["delivery-geography", "new-editorial-page", ""])("defaults to aside media for %j", (pageKey) => {
    expect(pageHeroLayoutForPage(pageKey)).toBe("aside");
  });

  it("publishes the public browser viewport profiles in version 1", () => {
    expect(PAGE_HERO_MEDIA_CONTRACT.version).toBe(1);
    expect(PAGE_HERO_MEDIA_CONTRACT.referenceViewports).toEqual({
      mobile: { width: 390, height: 844 },
      tablet: { width: 768, height: 1024 },
      desktop: { width: 1440, height: 1000 },
    });
  });
});
