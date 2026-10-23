import { createElement } from "react";
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

import type { CmsTireModel, CmsTireVariant } from "@/lib/content/types";
import { TireVariantsTable } from "./TireVariantsTable";

describe("TireVariantsTable", () => {
  it("renders the CMS availability value for each tire size", () => {
    const model = { slug: "dsr188", tireTypeSlug: "tbr" } as CmsTireModel;
    const variants: CmsTireVariant[] = [
      { id: "available", size: "12.00R20", available: true, priceOnRequest: true },
      { id: "unavailable", size: "12.00R20", available: false, priceOnRequest: true },
    ];

    const markup = renderToStaticMarkup(
      createElement(TireVariantsTable, { model, variants, modelPath: "/models/tbr/dsr188" }),
    );

    expect(markup).toMatch(/Наличие<\/dt><dd>В наличии<\/dd>/);
    expect(markup).toMatch(/Наличие<\/dt><dd>Нет в наличии<\/dd>/);
  });
});
