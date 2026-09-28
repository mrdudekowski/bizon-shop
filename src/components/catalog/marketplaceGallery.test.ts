import { describe, expect, it } from "vitest";

import { marketplaceShown } from "./marketplaceGallery";

describe("marketplaceShown", () => {
  it("keeps the pinned photo until a thumbnail is hovered", () => {
    expect(marketplaceShown(0, null)).toBe(0);
    expect(marketplaceShown(2, null)).toBe(2);
  });

  it("shows the hovered thumbnail without changing the pin", () => {
    expect(marketplaceShown(0, 3)).toBe(3);
    expect(marketplaceShown(1, 0)).toBe(0);
  });
});
