export function wrapIndex(index: number, count: number): number {
  if (count <= 0) return 0;
  return ((index % count) + count) % count;
}

/** Slot relative to the active card. The previous card sits just off the left, so a one-card frame never shows the wrap. */
export function loopSlot(index: number, active: number, count: number): number {
  if (count <= 1) return 0;
  const raw = wrapIndex(index - active, count);
  return raw === count - 1 ? -1 : raw;
}
