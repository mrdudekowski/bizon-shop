// @vitest-environment happy-dom
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/requests/submitRequest", () => ({
  submitRequest: vi.fn(),
}));

import { submitRequest } from "@/lib/requests/submitRequest";
import { ConfiguredForm, ConfiguredFormSuccess, type PageForm } from "./ConfiguredForm";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

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
  ],
};

const render = () => renderToStaticMarkup(createElement(ConfiguredForm, { form: SUPPLIER_FORM, sourceForm: "supplier" }));

describe("ConfiguredForm", () => {
  it("renders the stored labels in order with typed controls", () => {
    const html = render();
    const positions = SUPPLIER_FORM.fields.map((field) => html.indexOf(field.label));
    expect(positions.every((position) => position >= 0)).toBe(true);
    expect([...positions].sort((a, b) => a - b)).toEqual(positions);
    expect(html).not.toContain('type="file"');
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

  it("keeps required validation on the control inside its label", () => {
    const html = render();
    for (const field of SUPPLIER_FORM.fields.filter((item) => item.required)) {
      const label = new RegExp(
        `<label[^>]*>[\\s\\S]*${field.label}[\\s\\S]*<(?:input|textarea)[^>]*required[\\s\\S]*</label>`,
      );
      expect(html).toMatch(label);
    }
  });
});

describe("ConfiguredForm success", () => {
  let host: HTMLDivElement;
  let root: Root;

  afterEach(async () => {
    await act(async () => {
      root?.unmount();
    });
    host?.remove();
    vi.mocked(submitRequest).mockReset();
  });

  it("announces the server message on a stable focus target", async () => {
    vi.mocked(submitRequest).mockResolvedValue({
      ok: true,
      requestId: "req-1",
      message: "Из ответа сервера.",
    });
    host = document.createElement("div");
    document.body.appendChild(host);
    root = createRoot(host);
    await act(async () => {
      root.render(createElement(ConfiguredForm, { form: SUPPLIER_FORM, sourceForm: "supplier" }));
    });

    const form = host.querySelector("form");
    if (!(form instanceof HTMLFormElement)) throw new Error("form missing");
    await act(async () => {
      form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    });

    const status = host.querySelector("#configured-form-success");
    expect(submitRequest).toHaveBeenCalledTimes(1);
    expect(status?.getAttribute("role")).toBe("status");
    expect(status?.getAttribute("aria-live")).toBe("polite");
    expect(status?.textContent).toBe("Из ответа сервера.");
    expect(document.activeElement).toBe(status);
  });

  it("keeps a submit error in the form beside the fields", async () => {
    vi.mocked(submitRequest).mockRejectedValue(new Error("Сервер недоступен"));
    host = document.createElement("div");
    document.body.appendChild(host);
    root = createRoot(host);
    await act(async () => {
      root.render(createElement(ConfiguredForm, { form: SUPPLIER_FORM, sourceForm: "supplier" }));
    });

    const form = host.querySelector("form");
    if (!(form instanceof HTMLFormElement)) throw new Error("form missing");
    await act(async () => {
      form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    });

    const alert = host.querySelector("[role='alert']");
    expect(alert?.textContent).toContain("Сервер недоступен");
    expect(form.contains(alert)).toBe(true);
    expect(host.querySelector("input[name='companyName']")).not.toBeNull();
  });
});
