import { describe, expect, it } from "vitest";

import { loopSlot, wrapIndex } from "./loopIndex";

describe("wrapIndex", () => {
  it("wraps both directions onto the real cards", () => {
    expect(wrapIndex(3, 3)).toBe(0);
    expect(wrapIndex(-1, 3)).toBe(2);
    expect(wrapIndex(1, 3)).toBe(1);
    expect(wrapIndex(4, 0)).toBe(0);
  });
});

describe("loopSlot", () => {
  it("parks the previous card off the left and the next card off the right", () => {
    expect([0, 1, 2].map((index) => loopSlot(index, 0, 3))).toEqual([0, 1, -1]);
    expect([0, 1, 2].map((index) => loopSlot(index, 1, 3))).toEqual([-1, 0, 1]);
    expect([0, 1, 2].map((index) => loopSlot(index, 2, 3))).toEqual([1, -1, 0]);
  });

  it("moves one card by more than one slot when the index steps, and that card is the wrap", () => {
    const before = [0, 1, 2].map((index) => loopSlot(index, 0, 3));
    const after = [0, 1, 2].map((index) => loopSlot(index, 1, 3));
    const jumps = before.map((slot, index) => Math.abs(after[index] - slot) > 1);
    expect(jumps).toEqual([false, false, true]);
  });
});
