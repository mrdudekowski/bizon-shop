import type { ShopHomePageDraft } from "./domain/types";

function mediaId(placement?: { assetId: string } | null): number | null {
  if (!placement?.assetId) return null;
  const id = Number(placement.assetId);
  return Number.isFinite(id) ? id : null;
}

export function shopHomeParentValues(draft: ShopHomePageDraft): unknown[] {
  return [
    draft.seoTitle,
    draft.seoDescription,
    draft.hero.eyebrow,
    draft.hero.title,
    draft.hero.lead,
    draft.hero.cta.label,
    draft.hero.cta.href,
    mediaId(draft.hero.image),
    draft.hero.image?.alt || null,
    draft.wheelsIntro.eyebrow,
    draft.wheelsIntro.title,
    draft.wheelsIntro.lead,
    draft.wheelsIntro.kicker,
    draft.vehicles.eyebrow,
    draft.vehicles.title,
    draft.vehicles.lead,
    draft.vehicles.cta.label,
    draft.vehicles.cta.href,
    draft.catalog.copy.eyebrow,
    draft.catalog.copy.title,
    draft.catalog.copy.lead,
    draft.catalog.copy.sectionTitle,
  ];
}

export function shopHomeChildRows(parentId: number, draft: ShopHomePageDraft) {
  return {
    steps: draft.orderSteps.map((step, index) => ({
      id: step.id,
      parentId,
      order: index + 1,
      title: step.title,
      description: step.description,
    })),
    carousel: draft.categoryCarousel.map((slide, index) => ({
      id: slide.id,
      parentId,
      order: index + 1,
      kicker: slide.kicker,
      title: slide.title,
      action: slide.action,
      href: slide.href,
      alt: slide.alt,
      desktopImageId: mediaId(slide.desktopImage),
      mobileImageId: mediaId(slide.mobileImage),
    })),
    catalogTiles: draft.catalog.tiles.map((tile) => ({
      categoryId: Number(tile.categoryId),
      parentId,
      order: tile.sortOrder,
      title: tile.title,
      visible: tile.visible,
      iconId: mediaId(tile.icon),
      imageId: mediaId(tile.image),
      carouselImageId: mediaId(tile.carouselImage),
      carouselVisible: tile.carouselVisible,
      iconAlt: tile.icon?.alt ?? "",
      imageAlt: tile.image?.alt ?? "",
      carouselImageAlt: tile.carouselImage?.alt ?? "",
    })),
    vehicles: draft.vehicles.slides.map((slide, index) => ({
      id: slide.id,
      parentId,
      order: index + 1,
      title: slide.title,
      alt: slide.alt,
      imageId: mediaId(slide.image),
    })),
  };
}
