import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import type { PageForm } from "@/components/forms/ConfiguredForm";

const SUPPLIER_FORM: PageForm = {
  pageKey: "become-a-supplier",
  successMessage: "Сообщение из базы.",
  fields: [
    { id: "companyName", label: "Название компании", type: "text", required: true },
    { id: "contactName", label: "Контактное лицо", type: "text", required: true },
    { id: "phone", label: "Телефон", type: "tel", required: true },
    { id: "email", label: "Email", type: "email", required: true },
    { id: "companySite", label: "Сайт компании", type: "url", required: false },
    { id: "category", label: "Категория продукции", type: "text", required: true },
    { id: "offer", label: "Краткое описание предложения", type: "textarea", required: true },
    { id: "catalogFile", label: "Файл или каталог", type: "file", required: false },
  ],
};

const getPublishedStubOverlay = vi.hoisted(() => vi.fn());
vi.mock("@/lib/content/getPageContent", () => ({ getPublishedStubOverlay }));
vi.mock("next/navigation", () => ({ notFound: () => { throw new Error("notFound"); } }));

import BecomeASupplierPage from "./page";

const renderPage = async (form?: PageForm) => {
  getPublishedStubOverlay.mockResolvedValue({
    hero: { title: "Стать поставщиком", lead: "Лид" },
    sections: [{ id: "supplier-cooperation", heading: "", body: "Для рассмотрения предложения." }],
    ...(form ? { form } : {}),
  });
  return renderToStaticMarkup(await BecomeASupplierPage());
};

describe("become-a-supplier page", () => {
  it("renders the published form after the editorial sections", async () => {
    const html = await renderPage(SUPPLIER_FORM);
    for (const field of SUPPLIER_FORM.fields) expect(html).toContain(field.label);
    expect(html).toContain('type="file"');
    expect(html.indexOf("Для рассмотрения предложения.")).toBeLessThan(html.indexOf("Название компании"));
    expect(html).not.toMatch(/<span>[^<]*website[^<]*<\/span>/i);
  });

  it("renders no form when the page carries none", async () => {
    const html = await renderPage();
    expect(html).not.toContain("<form");
  });
});
