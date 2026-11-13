export type ShopCampaignFrame = {
  imageUrl: string;
  imageAlt: string;
  imageFocalX?: number;
  imageFocalY?: number;
  imageFocalByViewport?: import("../types").ResponsiveFocalMap;
};

type FrameSource = {
  imageUrl?: string | null;
  imageAlt?: string;
  imageFocalX?: number;
  imageFocalY?: number;
  imageFocalByViewport?: import("../types").ResponsiveFocalMap;
  frames?: unknown;
};

function isFrame(value: unknown): value is { imageUrl?: unknown; imageAlt?: unknown; imageFocalX?: unknown; imageFocalY?: unknown; imageFocalByViewport?: import("../types").ResponsiveFocalMap } {
  return typeof value === "object" && value !== null;
}

export function shopCampaignFrames(source: FrameSource): ShopCampaignFrame[] {
  const listed = Array.isArray(source.frames) ? source.frames.flatMap((frame) => {
    if (!isFrame(frame) || typeof frame.imageUrl !== "string" || frame.imageUrl.trim() === "") return [];
    return [{
      imageUrl: frame.imageUrl.trim(),
      imageAlt: typeof frame.imageAlt === "string" ? frame.imageAlt : "",
      ...(typeof frame.imageFocalX === "number" ? { imageFocalX: frame.imageFocalX } : {}),
      ...(typeof frame.imageFocalY === "number" ? { imageFocalY: frame.imageFocalY } : {}),
      ...(frame.imageFocalByViewport ? { imageFocalByViewport: frame.imageFocalByViewport } : {}),
    }];
  }) : [];
  if (listed.length > 0) return listed;
  if (typeof source.imageUrl === "string" && source.imageUrl.trim() !== "") {
    return [{
      imageUrl: source.imageUrl.trim(),
      imageAlt: source.imageAlt ?? "",
      ...(typeof source.imageFocalX === "number" ? { imageFocalX: source.imageFocalX } : {}),
      ...(typeof source.imageFocalY === "number" ? { imageFocalY: source.imageFocalY } : {}),
      ...(source.imageFocalByViewport ? { imageFocalByViewport: source.imageFocalByViewport } : {}),
    }];
  }
  return [];
}
