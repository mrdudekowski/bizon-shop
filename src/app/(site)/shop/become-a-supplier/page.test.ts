import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

const getPublishedStubOverlay = vi.hoisted(() => vi.fn());
vi.mock("@/lib/content/getPageContent", () => ({ getPublishedStubOverlay }));
vi.mock("next/navigation", () => ({ notFound: () => { throw new Error("notFound"); } }));

import ShopSupplierPage from "./page";

describe("shop become-a-supplier page", () => {
  it("renders the registry title when the overlay is missing", async () => {
    getPublishedStubOverlay.mockResolvedValue(null);
    const html = renderToStaticMarkup(await ShopSupplierPage());
    expect(html).toContain("Стать поставщиком");
  });

  it("renders the published overlay", async () => {
    getPublishedStubOverlay.mockResolvedValue({
      hero: { title: "Поставки в магазин", lead: "Для производителей" },
    });
    const html = renderToStaticMarkup(await ShopSupplierPage());
    expect(html).toContain("Поставки в магазин");
  });
});
