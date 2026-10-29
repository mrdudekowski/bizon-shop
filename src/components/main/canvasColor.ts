export type CanvasStop = { top: number; color: string };

const CANVAS = { light: "#ffffff", dark: "#0a0a0a" } as const;
const INK = { light: "#1c1c1c", dark: "#ffffff" } as const;

export function canvasToneColor(tone: string | null): string {
  return tone === "dark" ? CANVAS.dark : CANVAS.light;
}

function channel(hex: string, offset: number): number {
  return Number.parseInt(hex.slice(offset, offset + 2), 16);
}

export function mixHex(from: string, to: string, amount: number): string {
  const mix = Math.min(1, Math.max(0, amount));
  const value = [1, 3, 5].map((offset) => Math.round(channel(from, offset) + (channel(to, offset) - channel(from, offset)) * mix));
  return `#${value.map((part) => part.toString(16).padStart(2, "0")).join("")}`;
}

export function resolveCanvasColor(stops: CanvasStop[], viewportHeight: number, headerLine: number): string {
  const ordered = [...stops].sort((left, right) => left.top - right.top);
  if (ordered.length === 0) return CANVAS.light;
  const band = Math.max(viewportHeight - headerLine, 1);
  let previous = ordered[0].color;
  for (const stop of ordered) {
    if (stop.top <= headerLine) {
      previous = stop.color;
      continue;
    }
    if (stop.top >= viewportHeight) return previous;
    return mixHex(previous, stop.color, (viewportHeight - stop.top) / band);
  }
  return previous;
}

export function inkForCanvas(color: string): string {
  const luminance = (channel(color, 1) * 299 + channel(color, 3) * 587 + channel(color, 5) * 114) / 1000;
  return luminance > 150 ? INK.light : INK.dark;
}
