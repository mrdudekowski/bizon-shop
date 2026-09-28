import { describe, expect, it } from "vitest";
import type { ImagePlacement } from "@/admin/domain/types";
import { reorderGallery, swapWithCover } from "./placementGallery";

const photo = (id: string): ImagePlacement => ({
  assetId: id,
  alt: "",
  focalX: 0.5,
  focalY: 0.5,
  crop: { x: 0, y: 0, width: 1, height: 1 },
});

describe("swapWithCover", () => {
  it("promotes a gallery item to cover", () => {
    const cover = photo("a");
    const gallery = [photo("b"), photo("c")];
    const next = swapWithCover(cover, gallery, 1);
    expect(next.cover?.assetId).toBe("c");
    expect(next.gallery.map((item) => item.assetId)).toEqual(["a", "b"]);
  });
});

describe("reorderGallery", () => {
  it("moves an item within the gallery", () => {
    const gallery = [photo("b"), photo("c"), photo("d")];
    expect(reorderGallery(gallery, 0, 2).map((item) => item.assetId)).toEqual(["c", "d", "b"]);
  });
});
