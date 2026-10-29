import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { CatalogBuyPanel } from "./CatalogBuyPanel";

const PRICE_NOTICE = "Информация о ценах и наличии товаров на сайте носит информационный характер.";

const baseItem = {
  itemType: "tire",
  itemId: "model-1",
  name: "DSR188",
  slug: "dsr188",
  quantity: 1,
} as const;

function render(priceNotice?: string): string {
  return renderToStaticMarkup(
    createElement(CatalogBuyPanel, { baseItem, variants: [], priceNotice }),
  );
}

describe("CatalogBuyPanel price notice", () => {
  it("renders the price notice from the site profile", () => {
    expect(render(PRICE_NOTICE)).toContain(PRICE_NOTICE);
  });

  it("renders no price notice paragraph when the notice is empty or blank", () => {
    expect(render("")).not.toContain("data-price-notice");
    expect(render("   ")).not.toContain("data-price-notice");
    expect(render(undefined)).not.toContain("data-price-notice");
  });
});
