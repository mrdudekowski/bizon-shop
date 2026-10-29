import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ConfiguredForm, ConfiguredFormSuccess, type PageForm } from "./ConfiguredForm";

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

const render = () => renderToStaticMarkup(createElement(ConfiguredForm, { form: SUPPLIER_FORM, sourceForm: "supplier" }));

describe("ConfiguredForm", () => {
  it("renders the stored labels in order with typed controls", () => {
    const html = render();
    const positions = SUPPLIER_FORM.fields.map((field) => html.indexOf(field.label));
    expect(positions.every((position) => position >= 0)).toBe(true);
    expect([...positions].sort((a, b) => a - b)).toEqual(positions);
    expect(html).toContain('type="file"');
    expect(html).toContain('type="tel"');
    expect(html).toContain('type="url"');
    expect(html).toContain("<textarea");
  });

  it("renders a hidden honeypot named website and no visible website label", () => {
    const html = render();
    expect(html).toMatch(/<input[^>]*name="website"[^>]*aria-hidden="true"|<input[^>]*aria-hidden="true"[^>]*name="website"/);
    expect(html).not.toMatch(/<span>[^<]*website[^<]*<\/span>/i);
  });

  it("renders only the server message after success", () => {
    const html = renderToStaticMarkup(createElement(ConfiguredFormSuccess, { message: "Из ответа сервера." }));
    expect(html.replace(/<[^>]+>/g, "")).toBe("Из ответа сервера.");
  });

  it("carries no hardcoded thank-you text", () => {
    const html = render();
    expect(html).not.toContain("Заявка принята");
    expect(html).not.toContain("Спасибо");
  });
});
