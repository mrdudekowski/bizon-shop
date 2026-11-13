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

  it("keeps responsive coordinates and keys Shop tiles by category", () => {
    const positions = flattenImagePositions({
      catalog: {
        tiles: [{
          categoryId: "wheels.offroad",
          carouselImage: {
            assetId: "7",
            focalX: 0.2,
            focalY: 0.8,
            focalByViewport: { mobile: { x: 0.6, y: 0.4 }, tablet: { x: 0.7, y: 0.3 } },
          },
        }],
      },
    });

    expect(positions).toEqual([{
      path: "catalog.tiles.@categoryId=wheels%2Eoffroad.carouselImage",
      assetId: "7",
      focalX: 0.2,
      focalY: 0.8,
      focalByViewport: { tablet: { x: 0.7, y: 0.3 }, mobile: { x: 0.6, y: 0.4 } },
    }]);
  });

  it("restores reordered categories by stable identity and accepts legacy index paths", () => {
    const position = (path: string, focalX: number, focalY: number) => ({
      path,
      assetId: "7",
      focalX,
      focalY,
      focalByViewport: { mobile: { x: focalX, y: focalY } },
    });
    const draft = {
      catalog: { tiles: [
        { categoryId: "second", carouselImage: { assetId: "7", focalX: 0.5, focalY: 0.5 } },
        { categoryId: "first", carouselImage: { assetId: "7", focalX: 0.5, focalY: 0.5 } },
      ] },
    };
    const restored = restoreImagePositions(draft, [
      position("catalog.tiles.@categoryId=first.carouselImage", 0.1, 0.9),
      position("catalog.tiles.@categoryId=second.carouselImage", 0.8, 0.2),
    ]);

    expect(restored.catalog.tiles[0].carouselImage).toMatchObject({
      focalX: 0.8,
      focalY: 0.2,
      focalByViewport: { mobile: { x: 0.8, y: 0.2 } },
    });
    expect(restored.catalog.tiles[1].carouselImage).toMatchObject({ focalX: 0.1, focalY: 0.9 });
    expect(restoreImagePositions(
      { catalog: { tiles: [{ categoryId: "first", carouselImage: { assetId: "7", focalX: 0.5, focalY: 0.5 } }] } },
      [{ path: "catalog.tiles.0.carouselImage", assetId: "7", focalX: 0.3, focalY: 0.7 }],
    ).catalog.tiles[0].carouselImage).toMatchObject({ focalX: 0.3, focalY: 0.7 });
  });

  it("keys product variant images by variant identity", () => {
    expect(flattenImagePositions({ variants: [
      { id: "red.s", image: { assetId: "7", focalX: 0.2, focalY: 0.8 } },
      { id: "blue.m", image: { assetId: "7", focalX: 0.8, focalY: 0.2 } },
    ] }).map((item) => item.path)).toEqual([
      "variants.@variantId=red%2Es.image",
      "variants.@variantId=blue%2Em.image",
    ]);
  });

  it("restores only matching assets, with center defaults for missing or replaced placements", () => {
    const restored = restoreImagePositions({
      hero: { image: { assetId: "7", focalX: 0.5, focalY: 0.5 } },
      gallery: [{ assetId: "8", focalX: 0.5, focalY: 0.5, focalByViewport: { tablet: { x: 0.2, y: 0.8 } } }],
    }, [
      { path: "hero.image", assetId: "7", focalX: 0.2, focalY: 0.8 },
      {
        path: "gallery.0",
        assetId: "9",
        focalX: 0.1,
        focalY: 0.9,
        focalByViewport: { mobile: { x: 0.1, y: 0.9 } },
      },
    ]);
    expect(restored).toMatchObject({
      hero: { image: { focalX: 0.2, focalY: 0.8 } },
      gallery: [{ focalX: 0.5, focalY: 0.5 }],
    });
    expect(restored.gallery[0].focalByViewport).toBeUndefined();
    expect(flattenImagePositions({ gallery: [null] })).toEqual([]);
  });
});
