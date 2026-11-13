import { describe, expect, it } from "vitest";
import { responsiveFocalStyle } from "./responsiveFocalPosition";

describe("responsiveFocalStyle", () => {
  it("uses each viewport point and falls back independently to the legacy focal", () => {
    expect(responsiveFocalStyle(
      { desktop: { x: 0.2, y: 0.8 }, mobile: { x: 0.7, y: 0.3 } },
      0.4,
      0.6,
    )).toEqual({
      "--focal-desktop": "20% 80%",
      "--focal-tablet": "40% 60%",
      "--focal-mobile": "70% 30%",
    });
  });

  it("keeps old images centered when they have no focal metadata", () => {
    expect(responsiveFocalStyle()).toEqual({
      "--focal-desktop": "50% 50%",
      "--focal-tablet": "50% 50%",
      "--focal-mobile": "50% 50%",
    });
  });
});
