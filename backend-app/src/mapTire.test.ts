import { describe, expect, it } from "vitest";
import { lexicalToHtml, mapTireModel, mapTireVariant, normalizeImageUrl } from "./mapTire";

describe("mapTireModel", () => {
  it("maps a published row into the card the site renders", () => {
    const model = mapTireModel({
      row: {
        id: 24,
        name: "DSR188",
        slug: "dsr188",
        short_description: "Магистраль",
        full_description: { root: { children: [{ children: [{ text: "Длинный текст" }] }] } },
        series: "BIZON",
        tread_type: "ребро",
        status: "published",
      },
      tireType: { slug: "tbr", name: "TBR" },
      imageUrl: "/media/dsr188.jpg",
      gallery: [],
      advantages: [{ key: "handling", title: "Управление", description: "Держит колею" }],
      selectionAxles: ["steer"],
    });
    expect(model).toMatchObject({
      id: "24",
      slug: "dsr188",
      tireTypeSlug: "tbr",
      brand: "BIZON",
      treadType: "ребро",
      descriptionShort: "Магистраль",
      descriptionLong: "<p>Длинный текст</p>",
      imageUrl: "/media/dsr188.jpg",
      gallery: [],
      selectionAxles: ["steer"],
    });
  });

  it("drops data urls and draft rows are not mapped by the reader", () => {
    const model = mapTireModel({
      row: {
        id: 1,
        name: "X",
        slug: "x",
        short_description: "",
        full_description: null,
        series: null,
        tread_type: null,
        status: "published",
      },
      tireType: { slug: "tbr", name: "TBR" },
      imageUrl: "data:image/png;base64,aaaa",
      gallery: [],
      advantages: [],
      selectionAxles: [],
    });
    expect(model.imageUrl).toBeNull();
    expect(model.brand).toBe("");
  });
});

describe("mapTireVariant", () => {
  it("keeps price and price-on-request", () => {
    expect(
      mapTireVariant({
        id: 7,
        size: "315/80R22.5",
        price: null,
        price_on_request: true,
        available: true,
      }).priceOnRequest,
    ).toBe(true);
  });

  it("uses the normalized size and defaults missing live fields", () => {
    expect(
      mapTireVariant({
        id: 1,
        size: null,
        size_normalized: "385/65R22.5",
        price: null,
        price_on_request: null,
        available: null,
      }),
    ).toEqual({
      id: "1",
      size: "385/65R22.5",
      priceOnRequest: true,
      available: true,
    });
  });

  it("coerces Postgres numeric strings and preserves textual specifications", () => {
    expect(
      mapTireVariant({
        id: 8,
        size: "315/80R22.5",
        price: "18400.00",
        price_on_request: false,
        available: true,
        load_index: "154/150",
        speed_index: "L",
        rim_diameter: "22.5",
      }),
    ).toMatchObject({
      price: 18400,
      priceOnRequest: false,
      loadIndex: "154/150",
      speedIndex: "L",
      rimDiameter: 22.5,
    });
  });
});

describe("lexicalToHtml", () => {
  it("passes an existing html string through", () => {
    expect(lexicalToHtml("<p>Уже html</p>")).toBe("<p>Уже html</p>");
  });
});

describe("normalizeImageUrl", () => {
  it("points Payload file routes at the site media folder", () => {
    expect(normalizeImageUrl("/api/media/file/bizon-atlas-hero-3q.png")).toBe(
      "/media/bizon-atlas-hero-3q.png",
    );
    expect(normalizeImageUrl("/media/already.jpg")).toBe("/media/already.jpg");
    expect(normalizeImageUrl("data:image/png;base64,abc")).toBeNull();
  });
});
