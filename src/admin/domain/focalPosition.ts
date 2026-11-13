import { FOCAL_VIEWPORTS } from "./types";
import type { FocalPoint, FocalViewport, ImagePlacement } from "./types";

function clamp01(value: number): number {
  return Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : 0.5;
}

export function resolveFocalPoint(image: ImagePlacement, viewport: FocalViewport): FocalPoint {
  const point = image.focalByViewport?.[viewport];
  const fallback = { x: image.focalX, y: image.focalY };
  return {
    x: clamp01(point?.x ?? fallback.x),
    y: clamp01(point?.y ?? fallback.y),
  };
}

export function setFocalPoint(
  image: ImagePlacement,
  viewport: FocalViewport,
  point: FocalPoint,
): ImagePlacement {
  const normalized = { x: clamp01(point.x), y: clamp01(point.y) };
  const focalByViewport = Object.fromEntries(FOCAL_VIEWPORTS.map((mode) => [
    mode,
    mode === viewport ? normalized : resolveFocalPoint(image, mode),
  ])) as NonNullable<ImagePlacement["focalByViewport"]>;
  return {
    ...image,
    ...(viewport === "desktop" ? { focalX: normalized.x, focalY: normalized.y } : {}),
    focalByViewport,
  };
}
