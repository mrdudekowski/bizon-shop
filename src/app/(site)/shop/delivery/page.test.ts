import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

const getPublishedStubOverlay = vi.hoisted(() => vi.fn());
vi.mock("@/lib/content/getPageContent", () => ({ getPublishedStubOverlay }));
vi.mock("next/navigation", () => ({ notFound: () => { throw new Error("notFound"); } }));

import ShopDeliveryPage from "./page";

describe("shop delivery page", () => {
  it("renders the registry title when the overlay is missing", async () => {
    getPublishedStubOverlay.mockResolvedValue(null);
    const html = renderToStaticMarkup(await ShopDeliveryPage());
    expect(html).toContain("Доставка");
    expect(html).toContain('href="/shop"');
  });

  it("renders the published overlay", async () => {
    getPublishedStubOverlay.mockResolvedValue({
      hero: { title: "Доставка дисков", lead: "По России" },
      sections: [{ id: "ship", heading: "", body: "Отправляем после подтверждения." }],
    });
    const html = renderToStaticMarkup(await ShopDeliveryPage());
    expect(html).toContain("Доставка дисков");
    expect(html).toContain("Отправляем после подтверждения.");
  });
});
