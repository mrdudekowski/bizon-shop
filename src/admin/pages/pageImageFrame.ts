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
    | "proof";
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
} as const satisfies Record<string, PageImageFrame>;

export function focalObjectPosition(focalX = 0.5, focalY = 0.5): string {
  return `${focalX * 100}% ${focalY * 100}%`;
}
