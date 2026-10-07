export function splitPercent(clientX: number, left: number, width: number) {
  if (width <= 0) return 50;
  return Math.min(100, Math.max(0, ((clientX - left) / width) * 100));
}
