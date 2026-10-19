import { describe, expect, it } from "vitest";

import type { PageDraft } from "@/admin/domain/types";
import { previewAssetId } from "./pagePreview";

const page = (draft: object) => previewAssetId(draft as PageDraft);

describe("page card preview asset", () => {
  it("uses the home hero image before the campaign image", () => {
    expect(page({
      id: "home",
      hero: { image: { assetId: "hero" } },
      shopCampaign: { image: { assetId: "campaign" } },
    })).toBe("hero");
  });

  it("falls back to the home campaign image", () => {
    expect(page({ id: "home", hero: {}, shopCampaign: { image: { assetId: "campaign" } } })).toBe("campaign");
  });

  it("selects shop carousel desktop imagery before mobile imagery", () => {
    expect(page({
      id: "shop-home",
      hero: {},
      categoryCarousel: [
        { desktopImage: { assetId: "desktop-first" }, mobileImage: { assetId: "mobile-first" } },
        { desktopImage: { assetId: "desktop-second" }, mobileImage: { assetId: "mobile-second" } },
      ],
      vehicles: { slides: [{ image: { assetId: "vehicle" } }] },
    })).toBe("desktop-first");
  });

  it("falls back through shop hero, mobile carousel, then vehicle imagery", () => {
    expect(page({ id: "shop-home", hero: { image: { assetId: "hero" } }, categoryCarousel: [], vehicles: { slides: [] } })).toBe("hero");
    expect(page({ id: "shop-home", hero: {}, categoryCarousel: [{ mobileImage: { assetId: "mobile" } }], vehicles: { slides: [] } })).toBe("mobile");
    expect(page({ id: "shop-home", hero: {}, categoryCarousel: [], vehicles: { slides: [{ image: { assetId: "vehicle" } }] } })).toBe("vehicle");
  });

  it("uses the hero image for other pages and returns undefined without media", () => {
    expect(page({ id: "about", hero: { image: { assetId: "hero" } } })).toBe("hero");
    expect(page({ id: "about", hero: {} })).toBeUndefined();
  });
});
