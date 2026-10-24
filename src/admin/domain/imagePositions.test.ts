import { describe, expect, it } from "vitest";
import { flattenImagePositions, restoreImagePositions } from "./imagePositions";

describe("CMS image focal position persistence", () => {
  it("collects positions per placement path without conflating reused media", () => {
    const positions = flattenImagePositions({
      hero: { image: { assetId: "7", focalX: 0.2, focalY: 0.8 } },
      gallery: [{ assetId: "7", focalX: 0.1, focalY: 0.9 }],
    });
    expect(positions).toEqual([
      { path: "hero.image", assetId: "7", focalX: 0.2, focalY: 0.8 },
      { path: "gallery.0", assetId: "7", focalX: 0.1, focalY: 0.9 },
    ]);
  });

  it("restores only matching assets, with center defaults for missing or replaced placements", () => {
    const restored = restoreImagePositions({
      hero: { image: { assetId: "7", focalX: 0.5, focalY: 0.5 } },
      gallery: [{ assetId: "8", focalX: 0.5, focalY: 0.5 }],
    }, [
      { path: "hero.image", assetId: "7", focalX: 0.2, focalY: 0.8 },
      { path: "gallery.0", assetId: "9", focalX: 0.1, focalY: 0.9 },
    ]);
    expect(restored).toMatchObject({
      hero: { image: { focalX: 0.2, focalY: 0.8 } },
      gallery: [{ focalX: 0.5, focalY: 0.5 }],
    });
  });
});
