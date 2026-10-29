import { createElement } from "react";
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

import type { TireCatalogModel } from "@/lib/catalog/tireReadModel";
import type { CmsTireVariant } from "@/lib/content/types";
import { TireModelStage } from "./TireModelStage";

const emptyModel = {
  id: "model-1",
  name: "DSR188",
  slug: "dsr188",
  tireTypeSlug: "tbr",
  tireTypeName: "Грузовые шины",
  href: "/models/tbr/dsr188",
  sizes: [],
  brand: "BIZON",
  descriptionShort: "",
  descriptionLong: "",
  imageUrl: "",
  gallery: [],
  documents: [],
  advantages: [],
  selectionAxles: [],
  applicationTypes: [],
  applicationCategory: "",
  treadType: "",
  axlePosition: "",
  showInMenu: true,
  menuOrder: 0,
} as unknown as TireCatalogModel;

const SPECIALIST_SENTENCE = "Финальную совместимость, наличие и предложение подтверждает специалист BIZON.";

describe("TireModelStage", () => {
  it("shows the profile price notice instead of the hardcoded specialist sentence", () => {
    const notice = "Информация о ценах и наличии товаров на сайте носит информационный характер.";
    const stage = (priceNotice: string) => renderToStaticMarkup(
      createElement(TireModelStage, {
        model: { ...emptyModel },
        variants: [],
        modelPath: "/models/tbr/dsr188",
        breadcrumbs: [],
        priceNotice,
      }),
    );

    expect(stage(notice)).toContain(notice);
    expect(stage(notice)).not.toContain(SPECIALIST_SENTENCE);
    expect(stage("")).not.toContain(SPECIALIST_SENTENCE);
    expect(stage("")).not.toContain("data-price-notice");
  });

  it("disambiguates same-size choices by their load indexes and keeps variant IDs", () => {
    const model = {
      id: "model-1",
      name: "DSR188",
      slug: "dsr188",
      tireTypeSlug: "tbr",
      tireTypeName: "Грузовые шины",
      href: "/models/tbr/dsr188",
      sizes: ["12.00R20"],
      brand: "BIZON",
      descriptionShort: "",
      descriptionLong: "",
      imageUrl: "",
      gallery: [],
      documents: [],
      advantages: [],
      selectionAxles: [],
      applicationTypes: [],
      applicationCategory: "",
      treadType: "",
      axlePosition: "",
      showInMenu: true,
      menuOrder: 0,
    } as TireCatalogModel;
    const variants: CmsTireVariant[] = [
      { id: "variant-single", size: "12.00R20", loadIndex: "154", loadIndexDual: "183", available: true, priceOnRequest: true },
      { id: "variant-dual", size: "12.00R20", loadIndex: "154", loadIndexDual: "153", available: true, priceOnRequest: true },
    ];

    const markup = renderToStaticMarkup(
      createElement(TireModelStage, { model, variants, modelPath: "/models/tbr/dsr188", breadcrumbs: [] }),
    );

    expect(markup).toContain('<option value="variant-single">12.00R20 · LI dual 183</option>');
    expect(markup).toContain('<option value="variant-dual">12.00R20 · LI dual 153</option>');
  });
});
