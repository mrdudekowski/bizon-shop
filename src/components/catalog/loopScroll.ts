export function nextLoopScroll(scrollLeft: number, cycleWidth: number): number {
  if (cycleWidth <= 0) return scrollLeft;
  if (scrollLeft <= 0) return scrollLeft + cycleWidth;
  if (scrollLeft >= cycleWidth + 1) return scrollLeft - cycleWidth;
  return scrollLeft;
}

/** Index of the card whose left edge is nearest the viewport, mapped back onto the real items. */
export function activeLoopIndex(scrollLeft: number, itemCount: number, cardOffsets: number[]): number {
  if (itemCount < 1 || cardOffsets.length === 0) return 0;
  let nearest = 0;
  let nearestDistance = Infinity;
  cardOffsets.forEach((offset, index) => {
    const distance = Math.abs(offset - scrollLeft);
    if (distance < nearestDistance) {
      nearestDistance = distance;
      nearest = index;
    }
  });
  return nearest % itemCount;
}

/** Distance from the first card to its clone. Half of scrollWidth includes leftover gap and padding. */
export function loopPeriod(cardOffsets: number[], itemCount: number): number {
  if (itemCount < 1 || cardOffsets.length < itemCount + 1) return 0;
  const period = cardOffsets[itemCount] - cardOffsets[0];
  return period > 0 ? period : 0;
}
