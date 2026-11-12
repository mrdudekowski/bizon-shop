import type { EntityRecord, ShopCategoryDraft, ShopHomePageDraft } from "@/admin/domain/types";

export function mergeShopHomeCategories(
  page: ShopHomePageDraft,
  categories: EntityRecord<ShopCategoryDraft>[],
): ShopHomePageDraft {
  const existing = new Map(page.catalog.tiles.map((tile) => [tile.categoryId, tile]));
  const tiles = categories.map(({ id, draft }, index) => {
    const tile = existing.get(id);
    if (tile) {
      const normalizedTile = { ...tile } as typeof tile & { image?: unknown };
      delete normalizedTile.image;
      normalizedTile.homeCarouselCaption ??= "";
      return normalizedTile;
    }
    return {
      categoryId: id,
      title: draft.name,
      visible: draft.showInMenu,
      sortOrder: draft.sortOrder || index,
      carouselVisible: draft.carousel.length > 0,
      homeCarouselCaption: "",
      icon: draft.mainImage,
      carouselImage: draft.carousel[0]?.image,
    };
  });
  return { ...page, catalog: { ...page.catalog, tiles } };
}
