// @vitest-environment happy-dom
import { act, createElement, useRef } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";

import { HorizontalScrollCue } from "./HorizontalScrollCue";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const REDUCE_MOTION = "(prefers-reduced-motion: reduce)";

function installMotion(reduced: boolean) {
  window.matchMedia = ((query: string) => ({
    matches: query === REDUCE_MOTION ? reduced : false,
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

function CueHarness({ count }: { count: number }) {
  const trackRef = useRef<HTMLDivElement>(null);
  return createElement(
    "div",
    null,
    createElement(
      "div",
      { ref: trackRef, "data-track": "true" },
      Array.from({ length: count }, (_, index) => createElement("div", { key: index }, `card ${index}`)),
    ),
    createElement(HorizontalScrollCue, { trackRef, count }),
  );
}

describe("HorizontalScrollCue", () => {
  let host: HTMLDivElement;
  let root: Root;

  afterEach(async () => {
    await act(async () => {
      root?.unmount();
    });
    host?.remove();
  });

  async function renderCue(count: number, reduced: boolean) {
    installMotion(reduced);
    host = document.createElement("div");
    document.body.appendChild(host);
    root = createRoot(host);
    await act(async () => {
      root.render(createElement(CueHarness, { count }));
    });
  }

  function track() {
    const element = host.querySelector("[data-track]");
    if (!(element instanceof HTMLElement)) throw new Error("track missing");
    Object.defineProperty(element, "scrollWidth", { configurable: true, value: 900 });
    Object.defineProperty(element, "clientWidth", { configurable: true, value: 300 });
    Object.defineProperty(element, "scrollLeft", { configurable: true, value: 0 });
    const scrollTo = vi.fn();
    element.scrollTo = scrollTo;
    return { element, scrollTo };
  }

  it("scrolls without smooth behavior when the user prefers reduced motion", async () => {
    await renderCue(2, true);
    const { scrollTo } = track();
    const button = host.querySelector("button");
    if (!button) throw new Error("cue missing");
    await act(async () => {
      button.click();
    });
    expect(scrollTo).toHaveBeenCalledWith({ left: 246, behavior: "auto" });
  });

  it("keeps smooth scrolling when the user has not requested reduced motion", async () => {
    await renderCue(2, false);
    const { scrollTo } = track();
    const button = host.querySelector("button");
    if (!button) throw new Error("cue missing");
    await act(async () => {
      button.click();
    });
    expect(scrollTo).toHaveBeenCalledWith({ left: 246, behavior: "smooth" });
  });
});
