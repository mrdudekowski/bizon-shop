// @vitest-environment happy-dom
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/hooks/useFocusTrap", () => ({
  useFocusTrap: () => ({ current: null }),
}));

import { CartDrawer } from "./CartDrawer";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

describe("CartDrawer item type groups", () => {
  let host: HTMLDivElement;
  let root: Root;

  afterEach(async () => {
    await act(async () => root?.unmount());
    host?.remove();
  });

  it("labels tire items as Шины", async () => {
    host = document.createElement("div");
    document.body.appendChild(host);
    root = createRoot(host);

    await act(async () => {
      root.render(createElement(CartDrawer, {
        cartKind: "bizon",
        open: true,
        items: [{ itemType: "tire", name: "BIZON DSR177", quantity: 1 }],
        onClose: vi.fn(),
        onRemove: vi.fn(),
        onQuantityChange: vi.fn(),
        onClear: vi.fn(),
      }));
    });

    expect(host.textContent).toContain("Шины");
    expect(host.textContent).toContain("BIZON DSR177");
  });

  it("separates Диски from other BIZON Shop products", async () => {
    host = document.createElement("div");
    document.body.appendChild(host);
    root = createRoot(host);

    await act(async () => {
      root.render(createElement(CartDrawer, {
        cartKind: "shop",
        open: true,
        items: [
          { itemType: "wheel", name: "Forged One", quantity: 1 },
          { itemType: "shopProduct", name: "Shop product", quantity: 1 },
        ],
        onClose: vi.fn(),
        onRemove: vi.fn(),
        onQuantityChange: vi.fn(),
        onClear: vi.fn(),
      }));
    });

    expect(host.textContent).toContain("Диски");
    expect(host.textContent).toContain("Товары BIZON Shop");
    expect(host.textContent).toContain("Forged One");
    expect(host.textContent).toContain("Shop product");
  });
});
