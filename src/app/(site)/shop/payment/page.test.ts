import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

const getPublishedStubOverlay = vi.hoisted(() => vi.fn());
vi.mock("@/lib/content/getPageContent", () => ({ getPublishedStubOverlay }));
vi.mock("next/navigation", () => ({ notFound: () => { throw new Error("notFound"); } }));

import ShopPaymentPage from "./page";

describe("shop payment page", () => {
  it("renders the registry title and a shop cart link when the overlay is missing", async () => {
    getPublishedStubOverlay.mockResolvedValue(null);
    const html = renderToStaticMarkup(await ShopPaymentPage());

    expect(html).toContain("Оплата");
    expect(html).toContain('href="/shop/cart"');
    expect(html).toContain("Перейти к заявке");
    expect(html).not.toContain('href="/cart"');
    expect(html).not.toContain('href="/contact"');
    expect(html).not.toContain("<form");
  });

  it("keeps the shop cart href when the overlay button points at the main cart", async () => {
    getPublishedStubOverlay.mockResolvedValue({
      hero: { title: "Оплата в магазине", lead: "После заявки" },
      cta: { label: "К корзине магазина", href: "/cart" },
    });
    const html = renderToStaticMarkup(await ShopPaymentPage());

    expect(html).toContain("Оплата в магазине");
    expect(html).toContain("К корзине магазина");
    expect(html).toContain('href="/shop/cart"');
    expect(html).not.toContain('href="/cart"');
    expect(html).not.toContain('href="/contact"');
  });
});
