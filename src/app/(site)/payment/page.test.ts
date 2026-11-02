import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

const getPublishedStubOverlay = vi.hoisted(() => vi.fn());
vi.mock("@/lib/content/getPageContent", () => ({ getPublishedStubOverlay }));
vi.mock("next/navigation", () => ({ notFound: () => { throw new Error("notFound"); } }));

import PaymentPage from "./page";

describe("payment page", () => {
  it("renders the registry title and a cart link when the overlay is missing", async () => {
    getPublishedStubOverlay.mockResolvedValue(null);
    const html = renderToStaticMarkup(await PaymentPage());

    expect(html).toContain("Оплата");
    expect(html).toContain('href="/cart"');
    expect(html).toContain("Перейти к заявке");
    expect(html).not.toContain('href="/shop/cart"');
    expect(html).not.toContain('href="/contact"');
    expect(html).not.toContain("<form");
  });

  it("keeps the cart href when the overlay button points elsewhere", async () => {
    getPublishedStubOverlay.mockResolvedValue({
      hero: { title: "Оплата заказа", lead: "Способы оплаты" },
      sections: [{ id: "ways", heading: "Способы", body: "Счёт и карта." }],
      cta: { label: "Оформить заявку", href: "/contact" },
    });
    const html = renderToStaticMarkup(await PaymentPage());

    expect(html).toContain("Оплата заказа");
    expect(html).toContain("Оформить заявку");
    expect(html).toContain('href="/cart"');
    expect(html).not.toContain('href="/contact"');
    expect(html).not.toContain('href="/shop/cart"');
    expect(html).not.toContain("<form");
  });
});
