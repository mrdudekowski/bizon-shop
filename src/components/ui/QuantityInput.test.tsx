// @vitest-environment happy-dom
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";

import { QuantityInput } from "./QuantityInput";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

describe("QuantityInput", () => {
  let host: HTMLDivElement;
  let root: Root;

  afterEach(async () => {
    await act(async () => root?.unmount());
    host?.remove();
  });

  it("keeps an empty draft while allowing a manually entered multi-digit quantity", async () => {
    const onValueChange = vi.fn();
    host = document.createElement("div");
    document.body.appendChild(host);
    root = createRoot(host);
    await act(async () => {
      root.render(createElement(QuantityInput, {
        value: 1,
        min: 1,
        max: 99999,
        ariaLabel: "Количество",
        onValueChange,
      }));
    });

    const input = host.querySelector("input");
    if (!input) throw new Error("quantity input missing");
    const setInputValue = (value: string) => {
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set?.call(input, value);
      input.dispatchEvent(new Event("input", { bubbles: true }));
    };

    await act(async () => setInputValue(""));
    expect(input.value).toBe("");
    await act(async () => setInputValue("24"));
    expect(input.value).toBe("24");
    expect(onValueChange).toHaveBeenLastCalledWith(24);
  });

  it("clamps manually entered quantities to the configured range on blur", async () => {
    const onValueChange = vi.fn();
    host = document.createElement("div");
    document.body.appendChild(host);
    root = createRoot(host);
    await act(async () => {
      root.render(createElement(QuantityInput, {
        value: 4,
        min: 1,
        max: 8,
        ariaLabel: "Количество дисков",
        onValueChange,
      }));
    });

    const input = host.querySelector("input");
    if (!input) throw new Error("quantity input missing");
    await act(async () => {
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set?.call(input, "12");
      input.dispatchEvent(new Event("input", { bubbles: true }));
      input.dispatchEvent(new FocusEvent("focusout", { bubbles: true }));
    });
    expect(onValueChange).toHaveBeenLastCalledWith(8);
    expect(input.value).toBe("8");
  });
});
