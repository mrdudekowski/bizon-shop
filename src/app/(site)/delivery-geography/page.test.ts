import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import DeliveryGeographyPage, { metadata } from "./page";

describe("delivery-geography page", () => {
  it("renders a noindex refresh to the delivery page", () => {
    const html = renderToStaticMarkup(DeliveryGeographyPage());

    expect(html).toContain('href="/delivery/"');
    expect(html).toContain("url=/delivery/");
    expect(metadata.robots).toEqual({ index: false, follow: true });
  });
});
