import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

import type { CmsWheelModel, CmsWheelVariant } from "@/lib/content/types";
import { WheelVariantsTable } from "./WheelVariantsTable";

describe("WheelVariantsTable", () => {
  it("renders every configured wheel variant field on the public model page", () => {
    const variant: CmsWheelVariant = {
      id: "variant-1",
      modelId: "model-1",
      sizeLabel: "22.5×8.25",
      sku: "BIZON-225",
      diameter: 22.5,
      width: 8.25,
      boltHoles: 10,
      pcd: "10×335",
      pcdMm: 335,
      offsetET: 120,
      centerBore: 281,
      loadRating: "4500 кг",
      weight: 38.5,
      color: "Серебристый",
      finish: "Порошковая окраска",
      fastenerType: "Шпилька",
      fastenerMaterial: "Сталь",
      sourceSpecification: "Паспорт изделия",
      compatibleTireSizes: "315/80 R22.5",
      available: true,
      price: 12500,
      priceOnRequest: false,
    };
    const element = WheelVariantsTable({
      model: {} as CmsWheelModel,
      variants: [variant],
      modelPath: "/wheels/model/",
    });
    const markup = renderToStaticMarkup(element);

    for (const value of [
      "BIZON-225", "10", "335", "38.5", "Шпилька", "Сталь",
      "Паспорт изделия", "315/80 R22.5", "12500", "4500 кг",
    ]) {
      expect(markup).toContain(value);
    }
  });
});
