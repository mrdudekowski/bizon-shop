// @vitest-environment happy-dom
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ModelAdvantagesCarousel } from "./ModelAdvantagesCarousel";
import type { CmsTireAdvantage } from "@/lib/content/types";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const REDUCE_MOTION = "(prefers-reduced-motion: reduce)";

const advantages: CmsTireAdvantage[] = [
  { key: "cut", title: "Порез", description: "Держит борт" },
  { key: "heat", title: "Нагрев", description: "Отводит тепло" },
  { key: "load", title: "Нагрузка", description: "Держит вес" },
];

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

function activeTitle(host: ParentNode) {
  const article = [...host.querySelectorAll("article")].find((node) => node.getAttribute("aria-hidden") !== "true");
  return article?.querySelector("h2")?.textContent ?? "";
}

function dispatchTouch(target: Element, type: "touchstart" | "touchend", x: number, y: number) {
  const touch = { clientX: x, clientY: y, identifier: 0, target };
  const event = new Event(type, { bubbles: true, cancelable: true });
  Object.defineProperties(event, {
    touches: { value: type === "touchend" ? [] : [touch] },
    changedTouches: { value: [touch] },
  });
  target.dispatchEvent(event);
}

describe("ModelAdvantagesCarousel", () => {
  let host: HTMLDivElement;
  let root: Root;

  afterEach(async () => {
    await act(async () => {
      root?.unmount();
    });
    host?.remove();
    vi.useRealTimers();
  });

  async function renderCarousel(nextAdvantages: readonly CmsTireAdvantage[], reduced = false) {
    installMotion(reduced);
    host = document.createElement("div");
    document.body.appendChild(host);
    root = createRoot(host);
    await act(async () => {
      root.render(createElement(ModelAdvantagesCarousel, { advantages: nextAdvantages }));
    });
  }

  function carousel() {
    const region = host.querySelector("[aria-roledescription='carousel']");
    if (!region) throw new Error("carousel missing");
    return region;
  }

  async function clickControl(label: string) {
    const button = [...host.querySelectorAll("button")].find((node) => node.getAttribute("aria-label") === label);
    if (!button) throw new Error(`${label} missing`);
    await act(async () => {
      button.click();
    });
  }

  async function swipe(from: { x: number; y: number }, to: { x: number; y: number }) {
    await act(async () => {
      dispatchTouch(carousel(), "touchstart", from.x, from.y);
      dispatchTouch(carousel(), "touchend", to.x, to.y);
    });
  }

  it("keeps inactive slides free of tab stops", async () => {
    await renderCarousel(advantages);
    const hidden = [...host.querySelectorAll("article[aria-hidden='true']")];
    expect(hidden).toHaveLength(2);
    for (const article of hidden) {
      expect(article.querySelector("a, button, input, textarea, select, [tabindex]")).toBeNull();
    }
  });

  it("stops autoplay when a control inside the carousel receives focus", async () => {
    vi.useFakeTimers();
    await renderCarousel(advantages.slice(0, 2));
    await act(async () => {
      vi.advanceTimersByTime(7000);
    });
    expect(activeTitle(host)).toBe("Нагрев");

    const control = [...host.querySelectorAll("button")].find((node) => node.getAttribute("aria-label") === "Следующее преимущество");
    if (!control) throw new Error("control missing");
    await act(async () => {
      control.focus();
    });
    await act(async () => {
      vi.advanceTimersByTime(7000);
    });
    expect(activeTitle(host)).toBe("Нагрев");
  });

  it("ignores a swipe when the vertical movement is larger than the horizontal", async () => {
    await renderCarousel(advantages.slice(0, 2));
    await swipe({ x: 0, y: 0 }, { x: -60, y: 200 });
    expect(activeTitle(host)).toBe("Порез");
  });

  it("moves one slide on a horizontal swipe past the threshold", async () => {
    await renderCarousel(advantages);
    await swipe({ x: 100, y: 0 }, { x: 30, y: 10 });
    expect(activeTitle(host)).toBe("Нагрев");
    await swipe({ x: 0, y: 0 }, { x: -30, y: 0 });
    expect(activeTitle(host)).toBe("Нагрев");
  });

  it("wraps from the last advantage to the first and from the first to the last", async () => {
    await renderCarousel(advantages);
    await clickControl("Предыдущее преимущество");
    expect(activeTitle(host)).toBe("Нагрузка");
    await swipe({ x: 10, y: 10 }, { x: -70, y: 18 });
    expect(activeTitle(host)).toBe("Порез");
    await clickControl("Предыдущее преимущество");
    expect(activeTitle(host)).toBe("Нагрузка");
  });

  it("shows no controls for zero or one advantage", async () => {
    await renderCarousel([]);
    expect(host.querySelector("button")).toBeNull();
    expect(host.querySelector("article")).toBeNull();

    await act(async () => {
      root.render(createElement(ModelAdvantagesCarousel, { advantages: advantages.slice(0, 1) }));
    });
    expect(host.querySelector("button")).toBeNull();
    expect(activeTitle(host)).toBe("Порез");
  });

  it("does not autoplay when the user prefers reduced motion", async () => {
    vi.useFakeTimers();
    await renderCarousel(advantages.slice(0, 2), true);
    await act(async () => {
      vi.advanceTimersByTime(21000);
    });
    expect(activeTitle(host)).toBe("Порез");
  });
});
