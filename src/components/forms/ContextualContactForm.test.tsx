// @vitest-environment happy-dom
import { act, createElement, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  usePathname: () => "/contact",
}));

vi.mock("next/link", () => ({
  default: ({ href, children }: { href: string; children: ReactNode }) => createElement("a", { href }, children),
}));

vi.mock("@/lib/requests/submitRequest", () => ({
  submitRequest: vi.fn(),
}));

import { submitRequest } from "@/lib/requests/submitRequest";
import { ContextualContactForm } from "./ContextualContactForm";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

function installMatchMedia() {
  window.matchMedia = ((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener() {},
    removeEventListener() {},
    addListener() {},
    removeListener() {},
    dispatchEvent() {
      return false;
    },
  })) as typeof window.matchMedia;
}

function setControl(host: ParentNode, name: string, value: string) {
  const field = host.querySelector(`[name="${name}"]`);
  if (!(field instanceof HTMLInputElement) && !(field instanceof HTMLTextAreaElement)) {
    throw new Error(`missing ${name}`);
  }
  const prototype = field instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
  Object.getOwnPropertyDescriptor(prototype, "value")?.set?.call(field, value);
  field.dispatchEvent(new Event("input", { bubbles: true }));
}

describe("ContextualContactForm", () => {
  let host: HTMLDivElement;
  let root: Root;

  afterEach(async () => {
    await act(async () => {
      root?.unmount();
    });
    host?.remove();
    vi.mocked(submitRequest).mockReset();
  });

  async function renderForm() {
    installMatchMedia();
    host = document.createElement("div");
    document.body.appendChild(host);
    root = createRoot(host);
    await act(async () => {
      root.render(createElement(ContextualContactForm));
    });
  }

  it("announces success on a stable focus target", async () => {
    vi.mocked(submitRequest).mockResolvedValue({
      ok: true,
      requestId: "req-9",
      message: "Принято",
    });
    await renderForm();
    await act(async () => {
      setControl(host, "name", "Анна");
      setControl(host, "phone", "+7 900 000-00-00");
    });

    const form = host.querySelector("form");
    if (!(form instanceof HTMLFormElement)) throw new Error("form missing");
    await act(async () => {
      form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    });

    const status = host.querySelector("#contextual-contact-success");
    expect(submitRequest).toHaveBeenCalledTimes(1);
    expect(status?.getAttribute("role")).toBe("status");
    expect(status?.getAttribute("aria-live")).toBe("polite");
    expect(status?.textContent).toContain("Заявка req-9 принята");
    expect(document.activeElement).toBe(status);
  });

  it("keeps a submit error in the form and leaves email optional once phone is filled", async () => {
    await renderForm();
    const email = host.querySelector("input[name='email']");
    const phone = host.querySelector("input[name='phone']");
    if (!(email instanceof HTMLInputElement) || !(phone instanceof HTMLInputElement)) throw new Error("fields missing");
    expect(phone.required).toBe(true);
    expect(email.required).toBe(true);

    await act(async () => {
      setControl(host, "phone", "+7 900 000-00-00");
    });
    expect(email.required).toBe(false);
    expect(phone.closest("label")?.textContent).toContain("Телефон");
    expect(email.closest("label")?.textContent).toContain("Email");

    vi.mocked(submitRequest).mockRejectedValue(new Error("Сервер недоступен"));
    const form = host.querySelector("form");
    if (!(form instanceof HTMLFormElement)) throw new Error("form missing");
    await act(async () => {
      setControl(host, "name", "Анна");
      form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    });

    const alert = host.querySelector("[role='alert']");
    expect(alert?.textContent).toContain("Сервер недоступен");
    expect(form.contains(alert)).toBe(true);
    expect(host.querySelector("input[name='name']")).not.toBeNull();
  });
});
