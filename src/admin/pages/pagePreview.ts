import type { PageDraft } from "@/admin/domain/types";

export function previewAssetId(draft: PageDraft): string | undefined {
  if (draft.id === "home") return draft.hero.image?.assetId ?? draft.shopCampaign.image?.assetId;
  if (draft.id === "shop-home") {
    return draft.hero.image?.assetId
      ?? draft.categoryCarousel.find((slide) => slide.desktopImage || slide.mobileImage)?.desktopImage?.assetId
      ?? draft.categoryCarousel.find((slide) => slide.mobileImage)?.mobileImage?.assetId
      ?? draft.vehicles.slides.find((slide) => slide.image)?.image?.assetId;
  }
  return draft.hero.image?.assetId;
}
