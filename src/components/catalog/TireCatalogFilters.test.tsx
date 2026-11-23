// @vitest-environment happy-dom
import { act, createElement, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("next/link", () => ({
  default: ({ href, children }: { href: string; children: ReactNode }) => createElement("a", { href }, children),
}));

import { TireCatalogFilters } from "./TireCatalogFilters";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

describe("TireCatalogFilters", () => {
  let host: HTMLDivElement;
  let root: Root;

  afterEach(async () => {
    await act(async () => root?.unmount());
    host?.remove();
  });

  it("reports a size change immediately without a submit action", async () => {
    const onChange = vi.fn();
    host = document.createElement("div");
    document.body.appendChild(host);
    root = createRoot(host);

    await act(async () => {
      root.render(createElement(TireCatalogFilters, {
        filters: {},
        sizes: ["315/80R22.5"],
        models: [],
        onChange,
        onReset: vi.fn(),
      }));
    });

    const group = host.querySelector<HTMLElement>('[role="group"][aria-label="Фильтры каталога"]');
    const input = group?.querySelector('[name="size"]');
    if (!(input instanceof HTMLInputElement)) throw new Error("size input missing");
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set?.call(input, "315/80R22.5");
    await act(async () => input.dispatchEvent(new Event("input", { bubbles: true })));

    expect(onChange).toHaveBeenCalledWith({ size: "315/80R22.5" });
    expect(group?.querySelector('button[type="submit"]')).toBeNull();
  });
});
