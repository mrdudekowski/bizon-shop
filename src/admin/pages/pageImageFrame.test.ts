import { describe, expect, it } from "vitest";
import { previewAspectRatio } from "./pageImageFrame";

describe("previewAspectRatio", () => {
  it("uses the public page hero ratio for each device preview", () => {
    expect(previewAspectRatio("home-hero", "mobile")).toBe(9 / 16);
    expect(previewAspectRatio("home-hero", "tablet")).toBe(16 / 10);
    expect(previewAspectRatio("home-hero", "desktop")).toBe(16 / 10);
  });

  it("scales the Shop carousel's actual clamped frame at representative device sizes", () => {
    expect(previewAspectRatio("shop-category-carousel", "mobile")).toBeCloseTo(390 / 725.84);
    expect(previewAspectRatio("shop-category-carousel", "tablet")).toBeCloseTo(820 / 880.64);
    expect(previewAspectRatio("shop-category-carousel", "desktop")).toBeCloseTo(1440 / 774);
  });

  it("keeps a square variant preview square in all modes", () => {
    for (const viewport of ["mobile", "tablet", "desktop"] as const) {
      expect(previewAspectRatio(undefined, viewport)).toBe(1);
    }
  });
});
