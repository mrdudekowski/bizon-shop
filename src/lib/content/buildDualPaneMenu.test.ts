import { describe, expect, it } from "vitest";

import { ROUTES } from "@/constants/navigation";
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
