import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import type { CmsWheelModel, CmsWheelType } from "@/lib/content/types";
import { WheelModelStage } from "./WheelModelStage";

const wheelType = {
  slug: "forged",
  name: "Кованые диски",
  description: "",
  shortDescription: "",
  sortOrder: 0,
} as CmsWheelType;

const model = {
  id: "ember",
  slug: "ember",
  name: "BIZON Ember",
  wheelTypeSlug: "forged",
  wheelTypeName: "Кованые диски",
  series: "Red",
  descriptionShort: "Энергичный дизайн с ярким цветовым акцентом.",
  descriptionLong: "Энергичный дизайн с ярким цветовым акцентом.",
  gallery: [],
  showInMenu: true,
  menuOrder: 0,
} as CmsWheelModel;

describe("WheelModelStage", () => {
  it("shows the short description once, under the model name", () => {
    const markup = renderToStaticMarkup(
      createElement(WheelModelStage, {
        wheelType,
        model,
        variants: [],
        modelPath: "/shop/wheels/forged/ember",
      }),
    );

    expect(markup.split(model.descriptionShort).length - 1).toBe(1);
    expect(markup).toContain("Технические параметры и документы помогают проверить конфигурацию.");
    expect(markup).not.toContain("Это запрос на подбор");
    expect(markup).not.toContain("data-made-to-order-notice");
    expect(markup).not.toContain("Укажите параметры диска");
    expect(markup).not.toContain("Подробнее о диске");
  });

  it("keeps a model fitment note on the wheel page", () => {
    const fitmentNotes = "Производительная кованая геометрия с оптимизированным весом и зазором под многопоршневые суппорты.";
    const markup = renderToStaticMarkup(
      createElement(WheelModelStage, {
        wheelType,
        model: { ...model, fitmentNotes },
        variants: [],
        modelPath: "/shop/wheels/forged/ember",
      }),
    );

    expect(markup).toContain(fitmentNotes);
    expect(markup).not.toContain("Это запрос на подбор");
  });
});
