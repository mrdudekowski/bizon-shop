import { describe, expect, it } from "vitest";

import { shopCategoryIconUrl } from "./shopCategoryPresentation";

describe("shopCategoryIconUrl", () => {
  it.each([
    ["outdoor", "/images/shop/category-icons/camping-travel-black.png"],
    ["accessory", "/images/shop/category-icons/accessories-shirt-black.png"],
    ["accessories", "/images/shop/category-icons/car-comfort-black.png"],
    ["masla-i-zapchasti", "/images/shop/category-icons/oils-spare-parts-black.png"],
    ["pritsepy", "/images/shop/category-icons/trailers-black.png"],
  ])("maps %s to its black category icon", (slug, expected) => {
    expect(shopCategoryIconUrl(slug)).toBe(expected);
  });

  it("returns null for a category without a known icon", () => {
    expect(shopCategoryIconUrl("custom-category")).toBeNull();
  });
});
