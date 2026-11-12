import { describe, expect, it } from "vitest";
import type { EntityRecord, ShopCategoryDraft, ShopHomePageDraft } from "@/admin/domain/types";
import { mergeShopHomeCategories } from "./shopHomeCategories";

const page = {
  id: "shop-home",
  seoTitle: "Shop",
  seoDescription: "",
  hero: { eyebrow: "", title: "", lead: "", cta: { label: "", href: "" } },
  wheelsIntro: { eyebrow: "", title: "", lead: "", kicker: "" },
  homeCarousel: { diskCaption: "Диски" },
  orderSteps: [],
  categoryCarousel: [],
  catalog: {
    copy: { eyebrow: "", title: "", lead: "", sectionTitle: "" },
    tiles: [{
      categoryId: "existing",
      title: "Old name",
      visible: false,
      sortOrder: 8,
      carouselVisible: true,
      homeCarouselCaption: "Existing caption",
      icon: { assetId: "override-icon" },
    }],
  },
  vehicles: { eyebrow: "", title: "", lead: "", cta: { label: "", href: "" }, slides: [] },
} as ShopHomePageDraft;

function category(id: string, name: string, sortOrder: number, iconAssetId?: string): EntityRecord<ShopCategoryDraft> {
  return {
    id,
    draft: {
      id, name, slug: id, description: "", sortOrder, showInMenu: true,
      carousel: [],
      ...(iconAssetId ? { mainImage: { assetId: iconAssetId } } : {}),
    },
    savedDraft: null,
    publishedSnapshot: null,
    hidden: false,
    slugLocked: false,
    lastSavedBy: null,
    lastPublishedBy: null,
  };
}

describe("mergeShopHomeCategories", () => {
  it("preserves existing settings by id, adds current categories with blank captions, and drops obsolete rows", () => {
    const merged = mergeShopHomeCategories(page, [
      category("existing", "Renamed", 2, "new-category-icon"),
      category("new", "New category", 3, "new-icon"),
    ]);

    expect(merged.catalog.tiles).toEqual([
      expect.objectContaining({
        categoryId: "existing",
        title: "Old name",
        visible: false,
        sortOrder: 8,
        carouselVisible: true,
        homeCarouselCaption: "Existing caption",
        icon: { assetId: "override-icon" },
      }),
      expect.objectContaining({
        categoryId: "new",
        title: "New category",
        visible: true,
        sortOrder: 3,
        carouselVisible: false,
        homeCarouselCaption: "",
        icon: { assetId: "new-icon" },
      }),
    ]);
  });
});
