import { describe, expect, it } from "vitest";

import { splitPercent } from "./brandingSplit";

describe("splitPercent", () => {
  it("maps pointer x to 0–100 inside the frame", () => {
    expect(splitPercent(150, 100, 200)).toBe(25);
    expect(splitPercent(200, 100, 200)).toBe(50);
    expect(splitPercent(300, 100, 200)).toBe(100);
  });

  it("clamps outside the frame", () => {
    expect(splitPercent(0, 100, 200)).toBe(0);
    expect(splitPercent(900, 100, 200)).toBe(100);
  });

  it("stays at 50 when width is unusable", () => {
    expect(splitPercent(120, 100, 0)).toBe(50);
  });
});
