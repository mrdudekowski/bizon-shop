import { describe, expect, it } from "vitest";

import { canvasPaintMode } from "./canvasPaintMode";

describe("canvasPaintMode", () => {
  it("keeps the fade when the sample is between the endpoints", () => {
    expect(canvasPaintMode("rgb(80, 80, 80)", "rgb(10, 10, 10)", "rgb(255, 255, 255)")).toBe("fade");
  });

  it("is static when the color is already at either endpoint", () => {
    expect(canvasPaintMode("rgb(255, 255, 255)", "rgb(10, 10, 10)", "rgb(255, 255, 255)")).toBe("static");
    expect(canvasPaintMode("rgb(10, 10, 10)", "rgb(10, 10, 10)", "rgb(255, 255, 255)")).toBe("static");
  });
});
