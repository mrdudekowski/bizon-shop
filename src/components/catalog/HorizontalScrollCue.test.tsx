// @vitest-environment happy-dom
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";

import { HorizontalScrollCue } from "./HorizontalScrollCue";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

describe("HorizontalScrollCue", () => {
  let host: HTMLDivElement;
  let root: Root;

  afterEach(async () => {
    await act(async () => {
      root?.unmount();
    });
    host?.remove();
  });

  async function renderCue(activeIndex = 0) {
    const onStep = vi.fn();
    host = document.createElement("div");
    document.body.appendChild(host);
    root = createRoot(host);
    await act(async () => {
      root.render(createElement(HorizontalScrollCue, { count: 3, activeIndex, onStep }));
    });
    return onStep;
  }

  it("marks the real card count and the active card", async () => {
    await renderCue(1);
    expect([...host.querySelectorAll("[data-active]")].map((node) => node.getAttribute("data-active"))).toEqual([
      "false",
      "true",
      "false",
    ]);
  });

  it("steps forward and has no back button", async () => {
    const onStep = await renderCue(0);
    expect(host.querySelector("[aria-label='Предыдущая карточка']")).toBeNull();
    const next = host.querySelector<HTMLButtonElement>("[aria-label='Следующая карточка']");
    if (!next) throw new Error("cue button missing");
    expect(next.disabled).toBe(false);

    await act(async () => {
      next.click();
    });
    expect(onStep).toHaveBeenCalledWith(1);
  });
});
