/** Shares from Vkrainosti `teamZoneScroll` (Team viewport backdrop). */

export const HOME_SHOP_ZONE_SHELL = "[data-home-shell]";
export const HOME_SHOP_ZONE_ENTER_ID = "home-branding";
export const HOME_SHOP_ZONE_SECTION_ID = "home-shop";
export const HOME_SHOP_ZONE_EXIT_ID = "home-expertise";

/** Ease the backdrop over most of the viewport as branding enters and expertise returns it. */
export const SHOP_ZONE_FADE_IN_START_SHARE = 0.98 as const;
export const SHOP_ZONE_FADE_IN_END_SHARE = 0.22 as const;
export const SHOP_ZONE_FADE_OUT_START_SHARE = 0.98 as const;
export const SHOP_ZONE_FADE_OUT_END_SHARE = 0.22 as const;
export const SHOP_ZONE_REDUCED_MOTION_THRESHOLD = 0.5 as const;

export function getShopZoneViewportHeightPx(): number {
  if (typeof window === "undefined") return 0;
  return window.visualViewport?.height ?? window.innerHeight;
}

function clampUnitProgress(value: number): number {
  if (value <= 0) return 0;
  if (value >= 1) return 1;
  return value;
}

function easeInOut(value: number): number {
  return value * value * (3 - 2 * value);
}

export function computeShopZoneFadeInProgress(enterTopPx: number, viewportHeightPx: number): number {
  if (viewportHeightPx <= 0) return 0;
  const startY = viewportHeightPx * SHOP_ZONE_FADE_IN_START_SHARE;
  const endY = viewportHeightPx * SHOP_ZONE_FADE_IN_END_SHARE;
  const denom = startY - endY;
  if (denom <= 0) return 1;
  return easeInOut(clampUnitProgress((startY - enterTopPx) / denom));
}

export function computeShopZoneFadeOutProgress(exitTopPx: number, viewportHeightPx: number): number {
  if (viewportHeightPx <= 0) return 0;
  const startY = viewportHeightPx * SHOP_ZONE_FADE_OUT_START_SHARE;
  const endY = viewportHeightPx * SHOP_ZONE_FADE_OUT_END_SHARE;
  const denom = startY - endY;
  if (denom <= 0) return 0;
  return easeInOut(clampUnitProgress((exitTopPx - endY) / denom));
}

export function computeShopZoneBackdropProgress(
  enterSectionEl: HTMLElement | null,
  exitSectionEl: HTMLElement | null,
  viewportHeightPx: number
): number {
  if (viewportHeightPx <= 0 || enterSectionEl == null) return 0;

  const enterTop = enterSectionEl.getBoundingClientRect().top;
  const fadeIn = computeShopZoneFadeInProgress(enterTop, viewportHeightPx);
  if (exitSectionEl == null) return fadeIn;

  const exitTop = exitSectionEl.getBoundingClientRect().top;
  return Math.min(fadeIn, computeShopZoneFadeOutProgress(exitTop, viewportHeightPx));
}

export function resolveShopZoneProgress(progress: number, prefersReducedMotion: boolean): number {
  if (!prefersReducedMotion) return progress;
  return progress >= SHOP_ZONE_REDUCED_MOTION_THRESHOLD ? 1 : 0;
}
