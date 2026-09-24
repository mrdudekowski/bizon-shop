import { describe, expect, it } from "vitest";
import {
  buildMainDualPaneMenuSections,
  buildShopDualPaneMenuSections,
} from "./buildDualPaneMenu";
import type { CmsTireModel, CmsWheelModel } from "./types";

const model = {
  id: "1",
  slug: "dsr158",
  name: "DSR158",
  tireTypeSlug: "tbr",
  tireTypeName: "TBR",
  applicationCategory: "regional",
  brand: "BIZON",
  descriptionShort: "short",
  descriptionLong: "long",
  gallery: [],
  advantages: [{ key: "economy", title: "Economy" }],
  documents: [],
  selectionVehicleTypes: [],
  selectionConditions: [],
  selectionAxles: [],
  showInMenu: true,
  menuOrder: 1,
  imageUrl: "/tire.png",
} as CmsTireModel;

describe("buildMainDualPaneMenuSections", () => {
  it("keeps locked section order and default-related ids", () => {
    const sections = buildMainDualPaneMenuSections({
      models: [model],
      tireTypes: [
        {
          slug: "tbr",
          name: "TBR",
          description: "",
          shortDescription: "Truck",
          sortOrder: 1,
          showInMenu: true,
          selectionVehicleTypes: [],
          selectionConditions: [],
        },
      ],
      articles: [
        {
          slug: "guide",
          title: "Guide",
          excerpt: "Excerpt",
          publishedAt: "2026-01-01",
          content: null,
          showInMenu: true,
          menuOrder: 0,
        },
      ],
    });

    expect(sections.map((section) => section.id)).toEqual([
      "models",
      "tire-types",
      "shop",
      "branding",
      "tire-iq",
      "about",
    ]);
    expect(sections[0]?.footerLink?.href).toBe("/models");
    expect(sections[0]?.items[0]).toMatchObject({
      title: "DSR158",
      href: "/models/tbr/dsr158",
      pills: ["TBR", "Economy"],
    });
    expect(sections.find((section) => section.id === "about")?.items.map((item) => item.id)).toEqual([
      "about-page",
      "contact",
      "stories",
      "warranty",
      "supplier",
    ]);
  });
});

describe("buildShopDualPaneMenuSections", () => {
  it("defaults wheels section first with footer", () => {
    const wheel = {
      id: "w1",
      slug: "atlas",
      name: "Atlas",
      wheelTypeSlug: "forged",
      wheelTypeName: "Forged",
      descriptionShort: "",
      descriptionLong: "",
      gallery: [],
      showInMenu: true,
      menuOrder: 0,
      imageUrl: "/wheel.png",
      constructionMethod: "forged",
    } as CmsWheelModel;

    const sections = buildShopDualPaneMenuSections({
      wheels: [wheel],
      categories: [
        {
          slug: "accessories",
          name: "Аксессуары",
          description: "Acc",
          showInMenu: true,
          sortOrder: 1,
        },
      ],
    });

    expect(sections.map((section) => section.id)).toEqual([
      "wheels",
      "categories",
      "buyers",
      "bizon-tires",
    ]);
    expect(sections[0]?.footerLink?.href).toBe("/shop/wheels/forged");
    expect(sections[0]?.items[0]?.href).toBe("/shop/wheels/forged/atlas");
  });
});
