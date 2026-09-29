import { describe, expect, it } from "vitest";

import type { CmsTireModel, CmsTireType } from "@/lib/content/types";

import { getHeroTireSlides } from "./heroTireSlides";
import type { TireCatalogReadModel } from "./tireReadModel";

const tbr = {
  slug: "tbr",
  name: "TBR",
} as CmsTireType;

function model(partial: Partial<CmsTireModel> & Pick<CmsTireModel, "id" | "slug" | "name">) {
  return {
    tireTypeSlug: "tbr",
    tireTypeName: "TBR",
    applicationCategory: "regional",
    brand: "DOUBLESTAR",
    descriptionShort: "",
    descriptionLong: "",
    gallery: ["https://cdn.example.com/catalog-photo.jpg"],
    imageUrl: "https://cdn.example.com/catalog-cover.jpg",
    advantages: [],
    documents: [],
    selectionVehicleTypes: [],
    selectionConditions: [],
    selectionAxles: [],
    showInMenu: true,
    menuOrder: 0,
    href: `/models/tbr/regional/${partial.slug}`,
    sizes: [],
    ...partial,
  };
}

describe("getHeroTireSlides", () => {
  it("keeps TBR models without using catalog photos as cutouts", () => {
    const catalog: TireCatalogReadModel = {
      directions: [
        {
          ...tbr,
          models: [
            model({ id: "1", slug: "dsr158", name: "DSR158" }),
            model({
              id: "2",
              slug: "dsr177",
              name: "DSR177",
              imageUrl: null,
              gallery: [],
            }),
          ],
        },
      ],
    };

    expect(getHeroTireSlides(catalog)).toEqual([
      {
        id: "1",
        name: "DSR158",
        href: "/models/tbr/regional/dsr158",
        imageUrl: "/images/hero/dsr158.png",
        imageAlt: "DSR158 — грузовая шина",
      },
      {
        id: "2",
        name: "DSR177",
        href: "/models/tbr/regional/dsr177",
        imageUrl: "/images/hero/dsr177.png",
        imageAlt: "DSR177 — грузовая шина",
      },
    ]);
  });

  it("uses the cutout map when a slug is registered", () => {
    const catalog: TireCatalogReadModel = {
      directions: [
        {
          ...tbr,
          models: [model({ id: "1", slug: "dsr158", name: "DSR158" })],
        },
      ],
    };

    expect(getHeroTireSlides(catalog, { dsr158: "/images/hero-tires/dsr158.png" })[0]?.imageUrl).toBe(
      "/images/hero-tires/dsr158.png",
    );
  });
});
