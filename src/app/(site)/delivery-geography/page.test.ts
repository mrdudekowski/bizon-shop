import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import type { PageForm } from "@/components/forms/ConfiguredForm";

const GEOGRAPHY_FORM: PageForm = {
  pageKey: "delivery-geography",
  successMessage: "Сообщение из базы.",
  fields: [
    { id: "name", label: "Имя или название компании", type: "text", required: true },
    { id: "phone", label: "Телефон", type: "tel", required: true },
    { id: "email", label: "Email", type: "email", required: false },
    { id: "region", label: "Город или регион доставки", type: "text", required: true },
    { id: "product", label: "Наименование или категория товара", type: "text", required: true },
    { id: "quantity", label: "Необходимое количество", type: "text", required: false },
    { id: "comment", label: "Комментарий или дополнительная информация", type: "textarea", required: false },
  ],
};

const getPublishedStubOverlay = vi.hoisted(() => vi.fn());
vi.mock("@/lib/content/getPageContent", () => ({ getPublishedStubOverlay }));
vi.mock("next/navigation", () => ({ notFound: () => { throw new Error("notFound"); } }));

import DeliveryGeographyPage from "./page";

const renderPage = async (form?: PageForm) => {
  getPublishedStubOverlay.mockResolvedValue({
    hero: { title: "География поставок", lead: "Лид" },
    sections: [{ id: "geography-calculation", heading: "", body: "Стоимость и сроки доставки." }],
    ...(form ? { form } : {}),
  });
  return renderToStaticMarkup(await DeliveryGeographyPage());
};

describe("delivery-geography page", () => {
  it("renders the published form after the editorial sections", async () => {
    const html = await renderPage(GEOGRAPHY_FORM);
    for (const field of GEOGRAPHY_FORM.fields) expect(html).toContain(field.label);
    expect(html.indexOf("Стоимость и сроки доставки.")).toBeLessThan(html.indexOf("Имя или название компании"));
    expect(html).not.toMatch(/<span>[^<]*website[^<]*<\/span>/i);
    expect(html).not.toContain('type="file"');
  });

  it("requests the page overlay by its key", async () => {
    await renderPage(GEOGRAPHY_FORM);
    expect(getPublishedStubOverlay).toHaveBeenCalledWith("delivery-geography");
  });

  it("renders no form when the page carries none", async () => {
    const html = await renderPage();
    expect(html).not.toContain("<form");
  });
});
