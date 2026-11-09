import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import DeliveryAndReturnsPage, { metadata } from "./page";

describe("shop delivery-and-returns page", () => {
  it("renders a noindex refresh to the shop delivery page", () => {
    const html = renderToStaticMarkup(DeliveryAndReturnsPage());

    expect(html).toContain('href="/shop/delivery/"');
    expect(html).toContain("url=/shop/delivery/");
    expect(metadata.robots).toEqual({ index: false, follow: true });
  });
});
