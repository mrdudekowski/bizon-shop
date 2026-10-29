import { describe, expect, it } from "vitest";

import { activeLoopIndex, loopPeriod, nextLoopScroll } from "./loopScroll";

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

describe("loopPeriod", () => {
  it("uses the clone offset instead of half the track", () => {
    const offsets = [0, 345, 690, 1032, 1377, 1722];
    expect(loopPeriod(offsets, 3)).toBe(1032);
    expect(loopPeriod(offsets, 3)).not.toBe(1035);
  });

  it("returns 0 when the clone has not been laid out", () => {
    expect(loopPeriod([0, 345], 3)).toBe(0);
    expect(loopPeriod([], 3)).toBe(0);
  });
});

describe("activeLoopIndex", () => {
  const cards = [0, 345, 690, 1035, 1380, 1725];

  it("lights the item in view and returns to the first after the loop", () => {
    expect(activeLoopIndex(0, 3, cards)).toBe(0);
    expect(activeLoopIndex(1032, 3, cards)).toBe(0);
    expect(activeLoopIndex(1035, 3, cards)).toBe(0);
    expect(activeLoopIndex(1380, 3, cards)).toBe(1);
    expect(activeLoopIndex(690, 3, cards)).toBe(2);
    expect(activeLoopIndex(1725, 3, cards)).toBe(2);
  });
});
