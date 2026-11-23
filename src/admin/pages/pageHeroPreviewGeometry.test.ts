import { describe, expect, it } from "vitest";
import { pageHeroPreviewGeometry, pageHeroReferenceViewport } from "./pageHeroPreviewGeometry";

describe("pageHeroReferenceViewport", () => {
  it("uses the public reference viewport for each device", () => {
    expect(pageHeroReferenceViewport("mobile")).toEqual({ width: 390, height: 844 });
    expect(pageHeroReferenceViewport("tablet")).toEqual({ width: 768, height: 1024 });
    expect(pageHeroReferenceViewport("desktop")).toEqual({ width: 1440, height: 1000 });
  });
});

describe("pageHeroPreviewGeometry", () => {
  it.each([
    ["delivery", 390, 844, 472.64],
    ["shop-delivery", 768, 1024, 573.44],
    ["branding", 1440, 420, 256],
    ["branding", 1440, 1000, 560],
    ["branding", 1440, 1200, 672],
  ] as const)("uses full-width banner at %s (%i×%i)", (pageKey, viewportWidth, viewportHeight, height) => {
    const geometry = pageHeroPreviewGeometry({ pageKey, viewportWidth, viewportHeight });
    expect(geometry.layout).toBe("banner");
    expect(geometry.width).toBe(viewportWidth);
    expect(geometry.height).toBeCloseTo(height);
  });

  it.each([
    [390, 350, 273],
    [767, 727, 536.9],
    [768, 688, 256],
    [900, 820, 288],
    [901, 333.608, 288.32],
    [1279, 487.832, 409.28],
    [1280, 467.84, 409.6],
    [1440, 533.8, 416],
    [2000, 669.8, 416],
    [3000, 941.8, 416],
  ])("matches the public aside at %ipx", (viewportWidth, width, height) => {
    const geometry = pageHeroPreviewGeometry({ pageKey: "unknown-page", viewportWidth, viewportHeight: 1000 });
    expect(geometry.layout).toBe("aside");
    expect(geometry.width).toBeCloseTo(width, 3);
    expect(geometry.height).toBeCloseTo(height);
  });

  it("uses the supplied page container width before gutters and column gap", () => {
    const geometry = pageHeroPreviewGeometry({
      pageKey: "about",
      viewportWidth: 1440,
      viewportHeight: 1000,
      pageContainerWidth: 1100,
    });
    expect(geometry.width).toBeCloseTo(389.3);
  });
});
