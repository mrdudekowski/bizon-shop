import contract from "./pageHeroMediaContract.json";

// Geometry mirrors PageHero.module.css and the public container, gutter, and focal breakpoints in globals.css.
export const PAGE_HERO_MEDIA_CONTRACT = contract;

export function pageHeroLayoutForPage(pageKey: string): "banner" | "aside" {
  return PAGE_HERO_MEDIA_CONTRACT.bannerPageKeys.includes(pageKey) ? "banner" : "aside";
}
