import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

const getPublishedStubOverlay = vi.hoisted(() => vi.fn());
vi.mock("@/lib/content/getPageContent", () => ({ getPublishedStubOverlay }));
vi.mock("next/navigation", () => ({ notFound: () => { throw new Error("notFound"); } }));

import ShopWarrantyPage from "./page";

describe("shop warranty page", () => {
  it("uses the warranty-and-returns title when the overlay is missing", async () => {
    getPublishedStubOverlay.mockResolvedValue(null);
    const html = renderToStaticMarkup(await ShopWarrantyPage());
    expect(html).toContain("Гарантия и возврат");
  });

  it("keeps a published hero title and the warranty breadcrumb", async () => {
    getPublishedStubOverlay.mockResolvedValue({
      hero: { title: "Условия возврата", lead: "14 дней" },
    });
    const html = renderToStaticMarkup(await ShopWarrantyPage());
    expect(html).toContain("Условия возврата");
    expect(html).toContain("Гарантия и возврат");
  });
});
