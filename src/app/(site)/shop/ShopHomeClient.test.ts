import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { getPageDefaults } from "@/lib/content/pages/defaults";
import type { CmsWheelModel } from "@/lib/content/types";
import { ShopHomeClient } from "./ShopHomeClient";

const MADE_TO_ORDER_CHIP = "Изготавливается под заказ";

const wheelModel = {
  slug: "model-a",
  name: "Model A",
  imageUrl: "/images/model-a.jpg",
  showInMenu: true,
  menuOrder: 0,
  designStyle: "",
  series: "",
} as CmsWheelModel;

function render(): string {
  return renderToStaticMarkup(
    createElement(ShopHomeClient, {
      initialPage: getPageDefaults("shop-home"),
      initialModels: [wheelModel],
      initialCategories: [],
    }),
  );
}

function occurrences(haystack: string, needle: string): number {
  return haystack.split(needle).length - 1;
}

describe("ShopHomeClient wheels section", () => {
  it("keeps the made-to-order chip on the cards and leaves the long notice off the section", () => {
    const markup = render();

    expect(markup).not.toContain("data-made-to-order-notice");
    expect(occurrences(markup, MADE_TO_ORDER_CHIP)).toBe(2);
    expect(markup).toContain("Выберите свой дизайн");
    expect(markup).not.toContain("изготавливаются под заказ. Выберите модель");
    expect(markup).toContain("Получите подтверждение");
  });

  it("leaves a stored wheels intro lead off the page", () => {
    const defaults = getPageDefaults("shop-home");
    const markup = renderToStaticMarkup(
      createElement(ShopHomeClient, {
        initialPage: {
          ...defaults,
          wheelsIntro: { ...defaults.wheelsIntro, lead: "Кованые диски BIZON изготавливаются под заказ." },
        },
        initialModels: [wheelModel],
        initialCategories: [],
      }),
    );

    expect(markup).not.toContain("изготавливаются под заказ");
  });
});
