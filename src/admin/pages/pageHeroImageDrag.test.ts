import { describe, expect, it } from "vitest";
import { pageHeroImageDragPosition } from "./pageHeroImageDrag";

const landscape = {
  current: { x: 0.5, y: 0.6 },
  frameWidth: 200,
  frameHeight: 100,
  naturalWidth: 800,
  naturalHeight: 200,
  deltaX: 50,
  deltaY: 30,
};

describe("pageHeroImageDragPosition", () => {
  it("moves a cover image right by decreasing the horizontal object position", () => {
    // Cover scales the source to 400×100, leaving 200 pixels of horizontal travel.
    expect(pageHeroImageDragPosition(landscape)).toEqual({ x: 0.25, y: 0.6 });
  });

  it("moves a cover image down by decreasing the vertical object position", () => {
    // Cover scales the source to 100×400, leaving 200 pixels of vertical travel.
    expect(pageHeroImageDragPosition({
      ...landscape,
      frameWidth: 100,
      frameHeight: 200,
      naturalWidth: 200,
      naturalHeight: 800,
      deltaY: 50,
      current: { x: 0.6, y: 0.5 },
    })).toEqual({ x: 0.6, y: 0.25 });
  });

  it("clamps to both ends of the overflow", () => {
    expect(pageHeroImageDragPosition({ ...landscape, deltaX: 1000 }).x).toBe(0);
    expect(pageHeroImageDragPosition({ ...landscape, deltaX: -1000 }).x).toBe(1);
  });

  it("keeps both axes unchanged when the image already matches the frame", () => {
    expect(pageHeroImageDragPosition({ ...landscape, naturalWidth: 400 })).toEqual(landscape.current);
  });

  it.each([
    { naturalWidth: 0 },
    { naturalHeight: -1 },
    { naturalWidth: Number.NaN },
    { frameHeight: Number.POSITIVE_INFINITY },
    { frameWidth: 0 },
  ])("preserves the normalized current position with invalid dimensions %o", (dimensions) => {
    expect(pageHeroImageDragPosition({
      ...landscape,
      ...dimensions,
      current: { x: 1.2, y: Number.NaN },
    })).toEqual({ x: 1, y: 0.5 });
  });
});
