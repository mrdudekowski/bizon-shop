import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { getPageDefaults } from "@/lib/content/pages/defaults";
import type { CmsWheelModel } from "@/lib/content/types";
import { ShopHomeClient } from "./ShopHomeClient";

const MADE_TO_ORDER_NOTICE = "Часть продукции может быть доступна под заказ.";
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

function render(madeToOrderNotice: string): string {
  return renderToStaticMarkup(
    createElement(ShopHomeClient, {
      initialPage: getPageDefaults("shop-home"),
      initialModels: [wheelModel],
      initialCategories: [],
      madeToOrderNotice,
    }),
  );
}

function occurrences(haystack: string, needle: string): number {
  return haystack.split(needle).length - 1;
}

describe("ShopHomeClient made-to-order notice", () => {
  it("renders the notice once even though the card list is duplicated for the scroll loop", () => {
    const markup = render(MADE_TO_ORDER_NOTICE);

    expect(occurrences(markup, MADE_TO_ORDER_NOTICE)).toBe(1);
    expect(occurrences(markup, MADE_TO_ORDER_CHIP)).toBe(2);
  });

  it("renders no notice paragraph when the notice is empty", () => {
    const markup = render("");

    expect(markup).not.toContain("data-made-to-order-notice");
    expect(markup).toContain(MADE_TO_ORDER_CHIP);
  });
});
