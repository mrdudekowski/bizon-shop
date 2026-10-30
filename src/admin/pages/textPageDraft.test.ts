import { describe, expect, it } from "vitest";

import { pageListSurface, retiredPageReplacement } from "./textPageDraft";

describe("page list surfaces", () => {
  it("keeps one shared page, splits the twins, and retires the old addresses", () => {
    expect(pageListSurface("contact")).toBe("shared");
    expect(pageListSurface("about")).toBe("shared");
    expect(pageListSurface("privacy-policy")).toBe("shared");
    expect(pageListSurface("delivery")).toBe("tires");
    expect(pageListSurface("shop-delivery")).toBe("shop");
    expect(pageListSurface("branding")).toBe("tires");
    expect(pageListSurface("home")).toBe("tires");
    expect(pageListSurface("shop-home")).toBe("shop");
    expect(pageListSurface("delivery-geography")).toBeNull();
    expect(retiredPageReplacement("delivery-geography")).toBe("delivery");
    expect(retiredPageReplacement("shop-delivery-returns")).toBe("shop-delivery");
    expect(retiredPageReplacement("delivery")).toBeNull();
  });
});
