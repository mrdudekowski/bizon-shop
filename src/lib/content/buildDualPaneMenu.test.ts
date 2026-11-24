import { describe, expect, it } from "vitest";

import { ROUTES } from "@/constants/navigation";
import type { CmsTireModel } from "@/lib/content/types";
import { buildMainDualPaneMenuSections, buildShopDualPaneMenuSections } from "./buildDualPaneMenu";

describe("company links in the storefront menus", () => {
  it("keeps all four BIZON links under About", () => {
    const about = buildMainDualPaneMenuSections({ models: [], articles: [], categories: [] })
      .find((section) => section.id === "about");

    expect(about?.label).toBe("О компании");
    expect(about?.items.map((item) => item.href)).toEqual([
      ROUTES.about,
      ROUTES.contact,
      ROUTES.warranty,
      ROUTES.supplier,
      ROUTES.delivery,
      ROUTES.payment,
    ]);
  });

  it("groups the four BIZON SHOP pages under About and uses shop routes", () => {
    const about = buildShopDualPaneMenuSections({ wheels: [], categories: [] })
      .find((section) => section.id === "buyers");

    expect(about?.label).toBe("О компании");
    expect(about?.items.map((item) => item.href)).toEqual([
      ROUTES.shopDelivery,
      ROUTES.shopPayment,
      ROUTES.shopWarranty,
      ROUTES.shopSupplier,
      "/contact",
    ]);
  });
});

describe("runtime tire model menu links", () => {
  it("routes published tire model menu items through the shared model page", () => {
    const model = {
      id: "tire-1",
      name: "BIZON D930",
      slug: "d930",
      tireTypeSlug: "tbr",
      tireTypeName: "TBR",
      applicationTypes: [],
      brand: "BIZON",
      descriptionShort: "",
      descriptionLong: "",
      gallery: [],
      advantages: [],
      documents: [],
      selectionAxles: [],
    } as CmsTireModel;
    const models = buildMainDualPaneMenuSections({ models: [model], articles: [], categories: [] })
      .find((section) => section.id === "models");

    expect(models?.items[0]?.href).toBe("/models/view/?type=tbr&model=d930");
  });
});
