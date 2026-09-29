/** Shares from Vkrainosti `teamZoneScroll` (Team viewport backdrop). */

export const HOME_SHOP_ZONE_SHELL = "[data-home-shell]";
export const HOME_SHOP_ZONE_SECTION_ID = "home-shop";
export const HOME_SHOP_ZONE_EXIT_ID = "home-expertise";

export const SHOP_ZONE_FADE_IN_START_SHARE = 0.95 as const;
export const SHOP_ZONE_FADE_IN_END_SHARE = 0.42 as const;
export const SHOP_ZONE_FADE_OUT_START_SHARE = 0.92 as const;
export const SHOP_ZONE_FADE_OUT_END_SHARE = 0.48 as const;
export const SHOP_ZONE_SCROLL_QUANTIZE_PX = 4 as const;
export const SHOP_ZONE_REDUCED_MOTION_THRESHOLD = 0.5 as const;

export function quantizeShopZoneScrollPx(value: number): number {
  const q = SHOP_ZONE_SCROLL_QUANTIZE_PX;
  return q > 0 ? Math.round(value / q) * q : value;
}

export function getShopZoneViewportHeightPx(): number {
  if (typeof window === "undefined") return 0;
  return window.visualViewport?.height ?? window.innerHeight;
}

function clampUnitProgress(value: number): number {
  if (value <= 0) return 0;
  if (value >= 1) return 1;
  return value;
}

export function computeShopZoneFadeInProgress(shopTopPx: number, viewportHeightPx: number): number {
  if (viewportHeightPx <= 0) return 0;
  const startY = viewportHeightPx * SHOP_ZONE_FADE_IN_START_SHARE;
  const endY = viewportHeightPx * SHOP_ZONE_FADE_IN_END_SHARE;
  const denom = startY - endY;
  if (denom <= 0) return 1;
  return clampUnitProgress((startY - shopTopPx) / denom);
}

export function computeShopZoneFadeOutProgress(exitTopPx: number, viewportHeightPx: number): number {
  if (viewportHeightPx <= 0) return 0;
  const startY = viewportHeightPx * SHOP_ZONE_FADE_OUT_START_SHARE;
  const endY = viewportHeightPx * SHOP_ZONE_FADE_OUT_END_SHARE;
  const denom = startY - endY;
  if (denom <= 0) return 0;
  return clampUnitProgress((exitTopPx - endY) / denom);
}

export function computeShopZoneBackdropProgress(
  shopSectionEl: HTMLElement | null,
  exitSectionEl: HTMLElement | null,
  viewportHeightPx: number
): number {
  if (viewportHeightPx <= 0 || shopSectionEl == null) return 0;

  const shopTop = quantizeShopZoneScrollPx(shopSectionEl.getBoundingClientRect().top);
  const fadeIn = computeShopZoneFadeInProgress(shopTop, viewportHeightPx);
  if (exitSectionEl == null) return fadeIn;

  const exitTop = quantizeShopZoneScrollPx(exitSectionEl.getBoundingClientRect().top);
  return Math.min(fadeIn, computeShopZoneFadeOutProgress(exitTop, viewportHeightPx));
}

export function resolveShopZoneProgress(progress: number, prefersReducedMotion: boolean): number {
  if (!prefersReducedMotion) return progress;
  return progress >= SHOP_ZONE_REDUCED_MOTION_THRESHOLD ? 1 : 0;
}
