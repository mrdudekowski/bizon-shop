import { describe, expect, it } from "vitest";

import { mapTireModelDetail, mapTireVariant, mapWheelModelDetail } from "./mappers";

describe("mapTireModelDetail", () => {
  it("maps CMS features to site advantages", () => {
    const mapped = mapTireModelDetail({
      id: 1,
      slug: "dsr-188",
      name: "DSR 188",
      tireType: { slug: "tbr", name: "TBR" },
      features: [
        {
          key: "wet-grip",
          title: "Сцепление",
          description: "  На мокром покрытии  ",
        },
      ],
      gallery: [],
      documents: [],
    } as never);

    expect(mapped.advantages).toEqual([
      { key: "wet-grip", title: "Сцепление", description: "На мокром покрытии" },
    ]);
  });
});

describe("mapWheelModelDetail", () => {
  it("maps mainImage and gallery media with alt/label", () => {
    const mapped = mapWheelModelDetail({
      id: 42,
      slug: "atlas",
      name: "BIZON Atlas",
      wheelType: { slug: "forged", name: "Кованые диски" },
      designStyle: "Off-road",
      series: "Satin Black / Machined Silver",
      shortDescription: "Выразительная геометрия",
      mainImage: {
        id: 1,
        url: "/media/bizon-atlas-hero-3q.png",
        alt: "BIZON Atlas",
        title: "Hero",
      },
      gallery: [
        {
          id: 2,
          url: "/media/bizon-atlas-front.png",
          alt: "BIZON Atlas, фронтальный вид",
          title: "Front",
        },
        {
          id: 3,
          url: "/media/bizon-atlas-depth-3q.png",
          alt: "BIZON Atlas, объём",
          title: "Depth",
        },
      ],
      documents: [],
    } as never);

    expect(mapped.id).toBe("42");
    expect(mapped.imageUrl).toBeTruthy();
    expect(mapped.gallery).toEqual([
      {
        url: expect.stringContaining("bizon-atlas-front"),
        alt: "BIZON Atlas, фронтальный вид",
        label: "Front",
      },
      {
        url: expect.stringContaining("bizon-atlas-depth-3q"),
        alt: "BIZON Atlas, объём",
        label: "Depth",
      },
    ]);
    expect(mapped.series).toBe("Satin Black / Machined Silver");
    expect(mapped.designStyle).toBe("Off-road");
  });
});

describe("mapTireVariant", () => {
  it("uses normalized size and treats a null price as price on request", () => {
    const mapped = mapTireVariant({
      id: 1,
      sizeNormalized: " 315/80R22.5 ",
      sizeRaw: "315/80 R22.5",
      price: null,
      availabilityStatus: "on_request",
    } as never);

    expect(mapped.size).toBe("315/80R22.5");
    expect(mapped.priceOnRequest).toBe(true);
  });

  it("falls back to raw size and requires an available status for a direct price", () => {
    const mapped = mapTireVariant({
      id: 2,
      sizeNormalized: null,
      sizeRaw: " 12.00R20 ",
      price: 25_000,
      availabilityStatus: "unavailable",
    } as never);

    expect(mapped.size).toBe("12.00R20");
    expect(mapped.price).toBe(25_000);
    expect(mapped.priceOnRequest).toBe(true);
    expect(mapped.available).toBe(false);
  });
});
