import type { CSSProperties } from "react";
import type { ResponsiveFocalMap } from "./types";

type ResponsiveFocalStyle = CSSProperties & {
  "--focal-desktop"?: string;
  "--focal-tablet"?: string;
  "--focal-mobile"?: string;
};

function cssPoint(point: { x: number; y: number } | undefined, fallbackX: number, fallbackY: number): string {
  return `${(point?.x ?? fallbackX) * 100}% ${(point?.y ?? fallbackY) * 100}%`;
}

export function responsiveFocalStyle(
  focalByViewport?: ResponsiveFocalMap,
  legacyX = 0.5,
  legacyY = 0.5,
): ResponsiveFocalStyle {
  return {
    "--focal-desktop": cssPoint(focalByViewport?.desktop, legacyX, legacyY),
    "--focal-tablet": cssPoint(focalByViewport?.tablet, legacyX, legacyY),
    "--focal-mobile": cssPoint(focalByViewport?.mobile, legacyX, legacyY),
  };
}
