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
  applicationTypes: ["regional"],
  brand: "BIZON",
  descriptionShort: "short",
  descriptionLong: "long",
  gallery: [],
  advantages: [{ key: "economy", title: "Economy" }],
  documents: [],
  selectionAxles: [],
  showInMenu: true,
  menuOrder: 1,
  imageUrl: "/tire.png",
} as CmsTireModel;

describe("buildMainDualPaneMenuSections", () => {
  it("keeps locked section order and default-related ids", () => {
    const sections = buildMainDualPaneMenuSections({
      models: [model],
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
      categories: [
        {
          slug: "pritsepy",
          name: "Прицепы",
          description: "",
          imageUrl: "/cms/trailer.png",
          showInMenu: true,
          sortOrder: 0,
        },
      ],
    });

    expect(sections.map((section) => section.id)).toEqual([
      "models",
      "shop",
      "branding",
      "tire-iq",
      "about",
    ]);
    expect(sections[0]?.footerLink?.href).toBe("/models");
    expect(sections[0]?.items[0]).toMatchObject({
      title: "DSR158",
      href: "/models/tbr/regional/dsr158",
      imageUrl: "/images/hero/dsr158.png",
      pills: ["TBR"],
      advantages: [{ key: "economy", title: "Economy" }],
    });
    expect(sections.find((section) => section.id === "about")?.items.map((item) => item.id)).toEqual([
      "about-page",
      "contact",
      "warranty",
      "supplier",
      "delivery-geography",
    ]);
    expect(sections.find((section) => section.id === "shop")?.items.map((item) => item.id)).toEqual([
      "shop-home",
      "shop-wheels",
      "shop-categories",
    ]);
    expect(sections.find((section) => section.id === "branding")).toMatchObject({
      id: "branding",
      href: "/branding",
      items: [],
    });
  });

  it("caps Tire IQ menu items at first 5 articles", () => {
    const sections = buildMainDualPaneMenuSections({
      models: [],
      articles: Array.from({ length: 8 }, (_, index) => ({
        slug: `article-${index + 1}`,
        title: `Article ${index + 1}`,
        excerpt: "",
        publishedAt: "2026-01-01",
        content: null,
        showInMenu: true,
        menuOrder: index,
      })),
      categories: [],
    });
    const tireIq = sections.find((section) => section.id === "tire-iq");
    expect(tireIq?.items).toHaveLength(5);
    expect(tireIq?.footerLink).toEqual({ label: "Все материалы", href: "/tire-iq" });
  });

  it("lists every published model, not only showInMenu", () => {
    const hidden = { ...model, id: "2", slug: "dsr177", name: "DSR177", showInMenu: false, menuOrder: 0 };
    const sections = buildMainDualPaneMenuSections({
      models: [model, hidden],
      articles: [],
      categories: [],
    });
    expect(sections[0]?.items.map((item) => item.title)).toEqual(["DSR177", "DSR158"]);
  });

  it("keeps the catalog photo when no hero cutout exists", () => {
    const sections = buildMainDualPaneMenuSections({
      models: [{ ...model, slug: "custom-model" }],
      articles: [],
      categories: [],
    });
    expect(sections[0]?.items[0]?.imageUrl).toBe("/tire.png");
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
