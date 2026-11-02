import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

const getPublishedStubOverlay = vi.hoisted(() => vi.fn());
vi.mock("@/lib/content/getPageContent", () => ({ getPublishedStubOverlay }));
vi.mock("next/navigation", () => ({ notFound: () => { throw new Error("notFound"); } }));

import DeliveryPage from "./page";

describe("delivery page", () => {
  it("renders the registry title when the overlay is missing", async () => {
    getPublishedStubOverlay.mockResolvedValue(null);
    const html = renderToStaticMarkup(await DeliveryPage());
    expect(html).toContain("Доставка");
    expect(html).not.toContain("notFound");
  });

  it("renders the published hero and does not link the next step to contact", async () => {
    getPublishedStubOverlay.mockResolvedValue({
      hero: { title: "Доставка по России", lead: "Сроки" },
      sections: [{ id: "terms", heading: "", body: "Отгрузка со склада." }],
      cta: { label: "Уточнить доставку", href: "/contact" },
    });
    const html = renderToStaticMarkup(await DeliveryPage());
    expect(html).toContain("Доставка по России");
    expect(html).toContain("Отгрузка со склада.");
    expect(html).not.toContain("Следующий шаг");
    expect(html).not.toContain('href="/contact"');
  });
});
