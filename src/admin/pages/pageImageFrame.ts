/** Guest-site crop for a page-editor preview. Product editors do not use this. */
export type PageImageFrame = {
  id:
    | "home-hero"
    | "expertise"
    | "branding"
    | "shop-campaign"
    | "shop-hero"
    | "vehicle"
    | "page-hero"
    | "proof"
    | "shop-category-carousel";
  /** The public component writes object-position from focalX / focalY. */
  usesFocal: boolean;
};

export const PAGE_IMAGE_FRAMES = {
  homeHero: { id: "home-hero", usesFocal: true },
  expertise: { id: "expertise", usesFocal: true },
  branding: { id: "branding", usesFocal: true },
  shopCampaign: { id: "shop-campaign", usesFocal: true },
  shopHero: { id: "shop-hero", usesFocal: false },
  vehicle: { id: "vehicle", usesFocal: false },
  pageHero: { id: "page-hero", usesFocal: true },
  proof: { id: "proof", usesFocal: true },
  shopCategoryCarousel: { id: "shop-category-carousel", usesFocal: true },
} as const satisfies Record<string, PageImageFrame>;

export function previewAspectRatio(frameId: PageImageFrame["id"] | undefined, viewport: "desktop" | "tablet" | "mobile"): number {
  if (!frameId) return 1;
  if (frameId === "home-hero") return viewport === "mobile" ? 9 / 16 : 16 / 10;
  if (frameId === "expertise") return viewport === "desktop" ? 23 / 10 : 4 / 3;
  if (frameId === "branding") return viewport === "mobile" ? 4 / 3 : viewport === "tablet" ? 2 : 23 / 10;
  if (frameId === "shop-campaign") return viewport === "mobile" ? 2 / 3 : 16 / 9;
  if (frameId === "page-hero") return viewport === "desktop" ? 5 / 4 : 5 / 2;
  if (frameId === "proof") return viewport === "mobile" ? 5 / 4 : 4 / 3;
  if (frameId === "shop-category-carousel") {
    const width = viewport === "mobile" ? 390 : viewport === "tablet" ? 820 : 1440;
    const height = viewport === "mobile" ? 844 : viewport === "tablet" ? 1024 : 900;
    return width / Math.min(920, Math.max(620, height * 0.86));
  }
  if (frameId === "vehicle") return viewport === "mobile" ? 13 / 14 : 545 / 552;
  return viewport === "mobile" ? 9 / 16 : 16 / 10;
}

export function focalObjectPosition(focalX = 0.5, focalY = 0.5): string {
  return `${focalX * 100}% ${focalY * 100}%`;
}
