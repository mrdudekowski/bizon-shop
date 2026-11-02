// @vitest-environment happy-dom
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/requests/submitRequest", () => ({
  submitRequest: vi.fn(),
}));

vi.mock("@/hooks/useCart", () => ({
  useCart: (kind: "bizon" | "shop") => ({
    items: kind === "shop"
      ? [{ itemType: "wheel", name: "Forged One", slug: "one", quantity: 1 }]
      : [{ itemType: "tire", name: "CM335", slug: "cm335", quantity: 1 }],
    removeItem: vi.fn(),
    setQuantity: vi.fn(),
    clear: vi.fn(),
    count: 1,
    open: false,
    setOpen: vi.fn(),
    addItem: vi.fn(),
  }),
}));

import { submitRequest } from "@/lib/requests/submitRequest";
import { CartPage } from "./CartPage";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const routes = [
  {
    path: "/cart",
    kind: "bizon" as const,
    sourceForm: "tire_cart" as const,
    sourcePage: "/cart",
    returnLinks: [{ href: "/models", label: "Шины BIZON" }],
    successHref: "/models",
    successLabel: "Вернуться к шинам",
  },
  {
    path: "/shop/cart",
    kind: "shop" as const,
    sourceForm: "shop_cart" as const,
    sourcePage: "/shop/cart",
    returnLinks: [
      { href: "/shop/wheels/forged", label: "Кованые диски" },
      { href: "/shop", label: "Каталог BIZON Shop" },
    ],
    successHref: "/shop",
    successLabel: "Вернуться в BIZON Shop",
  },
];

describe("CartPage checkout success", () => {
  let host: HTMLDivElement;
  let root: Root;

  afterEach(async () => {
    await act(async () => {
      root?.unmount();
    });
    host?.remove();
    vi.mocked(submitRequest).mockReset();
    vi.restoreAllMocks();
  });

  it.each(routes)("focuses a polite success status for $path", async (route) => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    vi.mocked(submitRequest).mockResolvedValue({
      ok: true,
      requestId: "req-cart",
      message: "Заявка отправлена.",
    });
    host = document.createElement("div");
    document.body.appendChild(host);
    root = createRoot(host);
    await act(async () => {
      root.render(createElement(CartPage, route));
    });

    const form = host.querySelector("form");
    if (!(form instanceof HTMLFormElement)) throw new Error("checkout form missing");
    await act(async () => {
      form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    });

    const status = host.querySelector("#cart-checkout-success");
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(submitRequest).toHaveBeenCalledTimes(1);
    expect(status?.getAttribute("role")).toBe("status");
    expect(status?.getAttribute("aria-live")).toBe("polite");
    expect(status?.textContent).toContain("Спасибо");
    expect(document.activeElement).toBe(status);
  });
});
