import { describe, expect, it } from "vitest";
import { shouldMountLenis } from "./shouldMountLenis";

describe("shouldMountLenis", () => {
  it("stays off for touch", () => {
    expect(shouldMountLenis(false)).toBe(false);
  });

  it("turns on for a fine pointer", () => {
    expect(shouldMountLenis(true)).toBe(true);
  });
});
