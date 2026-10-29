export type CanvasPaintMode = "fade" | "static";

export function canvasPaintMode(sampledRgb: string, fromRgb: string, toRgb: string): CanvasPaintMode {
  if (sampledRgb === fromRgb || sampledRgb === toRgb) return "static";
  return "fade";
}
