import type { FocalPoint } from "@/admin/domain/types";

function normalize(value: number): number {
  return Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : 0.5;
}

export function pageHeroImageDragPosition({
  current,
  deltaX,
  deltaY,
  frameWidth,
  frameHeight,
  naturalWidth,
  naturalHeight,
}: {
  current: FocalPoint;
  deltaX: number;
  deltaY: number;
  frameWidth: number;
  frameHeight: number;
  naturalWidth: number;
  naturalHeight: number;
}): FocalPoint {
  const point = { x: normalize(current.x), y: normalize(current.y) };
  if (![frameWidth, frameHeight, naturalWidth, naturalHeight].every(
    (dimension) => Number.isFinite(dimension) && dimension > 0,
  )) return point;

  const imageRatio = naturalWidth / naturalHeight;
  const frameRatio = frameWidth / frameHeight;

  // CSS aligns the object in the remaining (negative) space after cover sizing.
  if (imageRatio > frameRatio && Number.isFinite(deltaX)) {
    const overflow = frameHeight * imageRatio - frameWidth;
    if (overflow > 0 && Number.isFinite(overflow)) point.x = normalize(point.x - deltaX / overflow);
  } else if (imageRatio < frameRatio && Number.isFinite(deltaY)) {
    const overflow = frameWidth / imageRatio - frameHeight;
    if (overflow > 0 && Number.isFinite(overflow)) point.y = normalize(point.y - deltaY / overflow);
  }

  return point;
}
