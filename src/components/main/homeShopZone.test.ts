import { describe, expect, it } from "vitest";

import {
  computeShopZoneFadeInProgress,
  computeShopZoneFadeOutProgress,
  SHOP_ZONE_FADE_IN_END_SHARE,
  SHOP_ZONE_FADE_IN_START_SHARE,
  SHOP_ZONE_FADE_OUT_END_SHARE,
  SHOP_ZONE_FADE_OUT_START_SHARE,
  resolveShopZoneProgress,
} from "./homeShopZone";

describe("computeShopZoneFadeInProgress", () => {
  const vh = 1000;

  it("is 0 when the branding top is at or below the start line", () => {
    expect(computeShopZoneFadeInProgress(vh * SHOP_ZONE_FADE_IN_START_SHARE, vh)).toBe(0);
    expect(computeShopZoneFadeInProgress(vh * SHOP_ZONE_FADE_IN_START_SHARE + 40, vh)).toBe(0);
  });

  it("is 1 when branding top is at or above the end line", () => {
    expect(computeShopZoneFadeInProgress(vh * SHOP_ZONE_FADE_IN_END_SHARE, vh)).toBe(1);
    expect(computeShopZoneFadeInProgress(vh * SHOP_ZONE_FADE_IN_END_SHARE - 80, vh)).toBe(1);
  });

  it("interpolates between start and end", () => {
    const midTop = (vh * SHOP_ZONE_FADE_IN_START_SHARE + vh * SHOP_ZONE_FADE_IN_END_SHARE) / 2;
    expect(computeShopZoneFadeInProgress(midTop, vh)).toBeCloseTo(0.5, 5);
  });
});

describe("computeShopZoneFadeOutProgress", () => {
  const vh = 1000;

  it("is 1 when the next section is at or below the start line", () => {
    expect(computeShopZoneFadeOutProgress(vh * SHOP_ZONE_FADE_OUT_START_SHARE, vh)).toBe(1);
    expect(computeShopZoneFadeOutProgress(vh * SHOP_ZONE_FADE_OUT_START_SHARE + 40, vh)).toBe(1);
  });

  it("is 0 when the next section is at or above the end line", () => {
    expect(computeShopZoneFadeOutProgress(vh * SHOP_ZONE_FADE_OUT_END_SHARE, vh)).toBe(0);
    expect(computeShopZoneFadeOutProgress(vh * SHOP_ZONE_FADE_OUT_END_SHARE - 40, vh)).toBe(0);
  });

  it("interpolates between start and end", () => {
    const midTop = (vh * SHOP_ZONE_FADE_OUT_START_SHARE + vh * SHOP_ZONE_FADE_OUT_END_SHARE) / 2;
    expect(computeShopZoneFadeOutProgress(midTop, vh)).toBeCloseTo(0.5, 5);
  });
});

describe("resolveShopZoneProgress", () => {
  it("stays continuous without reduced motion", () => {
    expect(resolveShopZoneProgress(0.4, false)).toBe(0.4);
  });

  it("snaps at the team threshold when reduced motion is on", () => {
    expect(resolveShopZoneProgress(0.49, true)).toBe(0);
    expect(resolveShopZoneProgress(0.5, true)).toBe(1);
  });
});
