import { describe, expect, it } from "vitest";
import { mapShopProduct } from "./mapShop";

describe("mapShopProduct", () => {
  it("renders the long description as html and ignores data-url gallery items", () => {
    expect(
      mapShopProduct(
        {
          id: 1,
          name: "Вентиль",
          slug: "valve",
          short_description: "Коротко",
          full_description: { root: { children: [{ text: "Полный текст" }] } },
          price: null,
          old_price: null,
          price_on_request: false,
          available: false,
          color: null,
          size: null,
          material: "латунь",
          category_slug: "valves",
        },
        "data:image/png;base64,abc",
        ["data:image/png;base64,abc", "/media/valve.jpg"],
        [],
      ),
    ).toMatchObject({
      descriptionLong: "<p>Полный текст</p>",
      imageUrl: null,
      gallery: ["/media/valve.jpg"],
      priceOnRequest: true,
      available: false,
      material: "латунь",
    });
  });
});