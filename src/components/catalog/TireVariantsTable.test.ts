import { createElement } from "react";
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

import type { CmsTireModel, CmsTireVariant } from "@/lib/content/types";
import { TireVariantsTable } from "./TireVariantsTable";

describe("TireVariantsTable", () => {
  it("omits availability from the technical table and renders all size parameters", () => {
    const model = { slug: "dsr188", tireTypeSlug: "tbr" } as CmsTireModel;
    const variants: CmsTireVariant[] = [
      {
        id: "44",
        size: "12.00R20",
        available: true,
        priceOnRequest: true,
        rimDiameter: 20,
        recommendedRim: "8.5",
        loadIndex: "156",
        loadIndexDual: "153",
        speedIndex: "J",
        plyRating: "20",
        overallDiameter: 1125,
        sectionWidth: 315,
        treadDepth: 18,
        pressureSingleKpa: 900,
        pressureDualKpa: 900,
        maxLoadSingleKg: 1814,
        maxLoadDualKg: 1656,
      },
    ];

    const markup = renderToStaticMarkup(
      createElement(TireVariantsTable, { model, variants, modelPath: "/models/tbr/dsr188" }),
    );

    expect(markup).not.toContain("Наличие");
    expect(markup).toContain("156 / 153");
    expect(markup).toContain("900 / 900");
    expect(markup).toContain("1814 / 1656");
    expect(markup).toContain("1125");
    expect(markup).toContain("315");
  });
});
