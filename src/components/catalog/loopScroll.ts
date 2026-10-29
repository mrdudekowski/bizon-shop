export function nextLoopScroll(scrollLeft: number, cycleWidth: number): number {
  if (cycleWidth <= 0) return scrollLeft;
  if (scrollLeft <= 0) return scrollLeft + cycleWidth;
  if (scrollLeft >= cycleWidth + 1) return scrollLeft - cycleWidth;
  return scrollLeft;
}
