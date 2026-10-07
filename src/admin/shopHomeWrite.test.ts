import { describe, expect, it } from "vitest";
import { shopHomeChildRows, shopHomeParentValues } from "./shopHomeWrite";
import type { ShopHomePageDraft } from "./domain/types";

function placement(assetId: string) {
  return { assetId, alt: "Shop tile", focalX: 0.5, focalY: 0.5, crop: { x: 0, y: 0, width: 1, height: 1 } };
}

const draft: ShopHomePageDraft = {
  id: "shop-home",
  seoTitle: "",
  seoDescription: "",
  hero: { eyebrow: "", title: "", lead: "", cta: { label: "", href: "" } },
  wheelsIntro: { eyebrow: "", title: "", lead: "", kicker: "" },
  orderSteps: [],
  categoryCarousel: [],
  catalog: {
    copy: { eyebrow: "Shop", title: "Catalog", lead: "Pick a category", sectionTitle: "Categories" },
    tiles: [{ categoryId: "5", title: "Camp", visible: true, sortOrder: 2, carouselVisible: true, icon: placement("11"), image: placement("12"), carouselImage: placement("13") }],
  },
  vehicles: { eyebrow: "", title: "", lead: "", cta: { label: "", href: "" }, slides: [] },
};

describe("shopHomeChildRows catalog tiles", () => {
  it("maps tile presentation and media placements to page-owned child rows", () => {
    expect(shopHomeChildRows(7, draft).catalogTiles).toEqual([
      {
        categoryId: 5,
        parentId: 7,
        order: 2,
        title: "Camp",
        visible: true,
        iconId: 11,
        imageId: 12,
        carouselImageId: 13,
        carouselVisible: true,
        iconAlt: "Shop tile",
        imageAlt: "Shop tile",
        carouselImageAlt: "Shop tile",
      },
    ]);
  });

  it("includes catalog page copy in the Shop page row values", () => {
    expect(shopHomeParentValues(draft).slice(-4)).toEqual([
      "Shop",
      "Catalog",
      "Pick a category",
      "Categories",
    ]);
  });
});
