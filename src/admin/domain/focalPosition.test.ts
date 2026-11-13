import { describe, expect, it } from "vitest";

import { resolveFocalPoint, setFocalPoint } from "./focalPosition";
import type { ImagePlacement } from "./types";

const image: ImagePlacement = {
  assetId: "media-1",
  alt: "image",
  focalX: 0.25,
  focalY: 0.75,
  crop: { x: 0, y: 0, width: 1, height: 1 },
};

describe("responsive focal points", () => {
  it("uses the legacy focal point for viewports without an override", () => {
    expect(resolveFocalPoint(image, "tablet")).toEqual({ x: 0.25, y: 0.75 });
  });

  it("updates only the selected viewport and mirrors desktop to legacy fields", () => {
    const mobileEdited = setFocalPoint(image, "mobile", { x: 0.8, y: 0.2 });
    expect(mobileEdited).toMatchObject({ focalX: 0.25, focalY: 0.75 });
    expect(resolveFocalPoint(mobileEdited, "mobile")).toEqual({ x: 0.8, y: 0.2 });
    expect(resolveFocalPoint(mobileEdited, "tablet")).toEqual({ x: 0.25, y: 0.75 });

    const desktopEdited = setFocalPoint(mobileEdited, "desktop", { x: 0.6, y: 0.4 });
    expect(desktopEdited).toMatchObject({ focalX: 0.6, focalY: 0.4 });
    expect(resolveFocalPoint(desktopEdited, "mobile")).toEqual({ x: 0.8, y: 0.2 });
    expect(resolveFocalPoint(desktopEdited, "tablet")).toEqual({ x: 0.25, y: 0.75 });
  });

  it("clamps edited coordinates to the normalized image bounds", () => {
    expect(setFocalPoint(image, "tablet", { x: -0.3, y: 1.4 }).focalByViewport?.tablet).toEqual({ x: 0, y: 1 });
  });
});
