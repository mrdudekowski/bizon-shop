import { describe, expect, it } from "vitest";

import { nextLoopScroll } from "./loopScroll";

describe("nextLoopScroll", () => {
  it("moves a stuck start forward one cycle and a passed cycle back one cycle", () => {
    expect(nextLoopScroll(0, 900)).toBe(900);
    expect(nextLoopScroll(901, 900)).toBe(1);
    expect(nextLoopScroll(900, 900)).toBe(900);
    expect(nextLoopScroll(450, 900)).toBe(450);
  });

  it("leaves the position alone when there is nothing to loop", () => {
    expect(nextLoopScroll(20, 0)).toBe(20);
  });
});
