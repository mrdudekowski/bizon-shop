import { describe, expect, it } from "vitest";

import { shopCategoryCarouselIconUrl, shopCategoryIconUrl } from "./shopCategoryPresentation";

describe("shopCategoryCarouselIconUrl", () => {
  it.each([
    ["outdoor", "/images/shop/category-icons/campfire-black.svg"],
    ["accessory", "/images/shop/category-icons/tshirt-black.svg"],
    ["masla-i-zapchasti", "/images/shop/category-icons/jerrycan-black.svg"],
  ])("maps %s to a monochrome carousel source", (slug, expected) => {
    expect(shopCategoryCarouselIconUrl(slug)).toBe(expected);
  });
});

describe("shopCategoryIconUrl", () => {
  it.each([
    ["outdoor", "/images/shop/category-icons/campfire-black.svg"],
    ["accessory", "/images/shop/category-icons/tshirt-black.svg"],
    ["accessories", "/images/shop/category-icons/car_seat-black.svg"],
    ["masla-i-zapchasti", "/images/shop/category-icons/jerrycan-black.svg"],
    ["pritsepy", "/images/shop/category-icons/rv_car-black.svg"],
  ])("maps %s to its black category icon", (slug, expected) => {
    expect(shopCategoryIconUrl(slug)).toBe(expected);
  });

  it("returns null for a category without a known icon", () => {
    expect(shopCategoryIconUrl("custom-category")).toBeNull();
  });
});
