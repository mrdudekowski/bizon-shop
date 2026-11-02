import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import type { PageForm } from "@/components/forms/ConfiguredForm";

const WARRANTY_FORM: PageForm = {
  pageKey: "warranty",
  successMessage: "Сообщение из базы.",
  fields: [
    { id: "name", label: "Имя", type: "text", required: true },
    { id: "phone", label: "Телефон", type: "tel", required: true },
    { id: "email", label: "Email", type: "email", required: true },
    { id: "comment", label: "Описание обращения", type: "textarea", required: true },
  ],
};

const WARRANTY_DOCUMENT = {
  url: "https://cdn.example.test/warranty.pdf",
  title: "Условия гарантии",
};

const getPublishedStubOverlay = vi.hoisted(() => vi.fn());
vi.mock("@/lib/content/getPageContent", () => ({ getPublishedStubOverlay }));
vi.mock("next/navigation", () => ({ notFound: () => { throw new Error("notFound"); } }));

import WarrantyPage from "./page";

const renderPage = async (form?: PageForm, documents?: { url: string; title: string }[]) => {
  getPublishedStubOverlay.mockResolvedValue({
    hero: { title: "Гарантия", lead: "Лид" },
    sections: [{ id: "warranty-terms", heading: "", body: "Условия гарантии описаны ниже." }],
    cta: { label: "Задать вопрос по гарантии", href: "/contact?subject=warranty" },
    ...(documents ? { documents } : {}),
    ...(form ? { form } : {}),
  });
  return renderToStaticMarkup(await WarrantyPage());
};

describe("warranty page", () => {
  it("renders the published form, keeps document links, and hides the next-step block", async () => {
    const html = await renderPage(WARRANTY_FORM, [WARRANTY_DOCUMENT]);
    for (const field of WARRANTY_FORM.fields) expect(html).toContain(field.label);
    expect(html).toContain("Гарантия и возврат");
    expect(html).toContain(">Гарантия</h1>");
    expect(html).not.toContain("Следующий шаг");
    expect(html).toContain('href="https://cdn.example.test/warranty.pdf"');
    expect(html).toContain("Условия гарантии");
    expect(html).not.toContain('type="file"');
    expect(html.indexOf("Условия гарантии описаны ниже.")).toBeLessThan(html.indexOf("Имя"));
    expect(html).not.toMatch(/<span>[^<]*website[^<]*<\/span>/i);
  });

  it("renders no form when the page carries none", async () => {
    const html = await renderPage();
    expect(html).not.toContain("<form");
  });
});
