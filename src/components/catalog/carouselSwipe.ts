const SWIPE_THRESHOLD_PX = 48;

/** Next is 1, previous is -1, and 0 is not a carousel swipe. A taller vertical move belongs to the page. */
export function carouselSwipeStep(deltaX: number, deltaY: number): -1 | 0 | 1 {
  if (Math.abs(deltaY) > Math.abs(deltaX) || Math.abs(deltaX) < SWIPE_THRESHOLD_PX) return 0;
  return deltaX < 0 ? 1 : -1;
}
