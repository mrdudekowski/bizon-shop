"use client";

import type { ImagePlacement } from "@/admin/domain/types";
import { PlacementFields } from "@/admin/media/PlacementFields";
import { PAGE_IMAGE_FRAMES } from "./pageImageFrame";

type Props = {
  pageKey: string;
  value: ImagePlacement | null | undefined;
  onChange(value: ImagePlacement | undefined): void;
  label?: string;
  uploadMode?: "replace" | "new-asset";
};

export function PageHeroImageFields({
  pageKey,
  value,
  onChange,
  label = "Изображение шапки",
  uploadMode = "replace",
}: Props) {
  function updatePlacement(next: ImagePlacement | undefined) {
    if (uploadMode === "new-asset" && value && next && next.assetId !== value.assetId) {
      const placement = { ...value, assetId: next.assetId };
      delete placement.replacementAssetId;
      onChange(placement);
      return;
    }
    onChange(next);
  }

  return (
    <PlacementFields
      label={label}
      frame={PAGE_IMAGE_FRAMES.pageHero}
      pageHeroPreview={{ pageKey }}
      uploadMode={uploadMode}
      manageReplacement={uploadMode !== "new-asset"}
      allowFileDrop={uploadMode === "new-asset"}
      value={value}
      onChange={updatePlacement}
    />
  );
}
