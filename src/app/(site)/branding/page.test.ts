import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import type { PageForm } from "@/components/forms/ConfiguredForm";

const BRANDING_FORM: PageForm = {
  pageKey: "branding",
  successMessage: "Сообщение из базы.",
  fields: [
    { id: "name", label: "Имя", type: "text", required: true },
    { id: "phone", label: "Телефон", type: "tel", required: true },
    { id: "email", label: "Email", type: "email", required: true },
    { id: "comment", label: "Комментарий", type: "textarea", required: false },
  ],
};

const getPublishedStubOverlay = vi.hoisted(() => vi.fn());
vi.mock("@/lib/content/getPageContent", () => ({ getPublishedStubOverlay }));
vi.mock("next/navigation", () => ({ notFound: () => { throw new Error("notFound"); } }));

import BrandingPage from "./page";

const renderPage = async (form?: PageForm) => {
  getPublishedStubOverlay.mockResolvedValue({
    hero: { title: "Брендирование", lead: "Лид" },
    sections: [{ id: "branding-offer", heading: "", body: "Нанесём логотип на технику." }],
    cta: { label: "Оставить заявку", href: "/contact?subject=branding" },
    ...(form ? { form } : {}),
  });
  return renderToStaticMarkup(await BrandingPage());
};

describe("branding page", () => {
  it("renders the published form and hides the next-step block", async () => {
    const html = await renderPage(BRANDING_FORM);
    for (const field of BRANDING_FORM.fields) expect(html).toContain(field.label);
    expect(html).not.toContain("Следующий шаг");
    expect(html).not.toContain('type="file"');
    expect(html.indexOf("Нанесём логотип на технику.")).toBeLessThan(html.indexOf("Имя"));
    expect(html).not.toMatch(/<span>[^<]*website[^<]*<\/span>/i);
  });

  it("renders no form when the page carries none", async () => {
    const html = await renderPage();
    expect(html).not.toContain("<form");
  });
});
