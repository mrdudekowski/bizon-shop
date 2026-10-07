import { describe, expect, it } from "vitest";
import { mapShopCategory, mapShopProduct } from "./mapShop";

describe("mapShopCategory", () => {
  it("keeps the icon separate from one gallery photo", () => {
    expect(
      mapShopCategory(
        {
          name: "Кемпинг и путешествия",
          slug: "outdoor",
          description: null,
          show_in_menu: true,
          sort_order: 0,
          image_url: "/media/camping-travel.png",
        },
        [
          { title: "Стоянка у воды", image_url: "/media/camp.jpg" },
          { title: "Лишний", image_url: "/media/5.jpg" },
        ],
      ),
    ).toEqual({
      slug: "outdoor",
      name: "Кемпинг и путешествия",
      description: "",
      imageUrl: "/media/camping-travel.png",
      showInMenu: true,
      sortOrder: 0,
      carousel: [{ title: "Стоянка у воды", imageUrl: "/media/camp.jpg" }],
    });
  });
});

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