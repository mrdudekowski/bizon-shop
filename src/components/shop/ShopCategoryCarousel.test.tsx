// @vitest-environment happy-dom
import { act, createElement, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ShopCategoryCarousel } from "./ShopCategoryCarousel";
import type { ShopHomeCarouselSlide } from "@/lib/content/shopCategoryPresentation";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const REDUCE_MOTION = "(prefers-reduced-motion: reduce)";

const slides: ShopHomeCarouselSlide[] = [
  { id: "oils", title: "Масла", href: "/shop/oils", imageUrl: "/oils.jpg" },
  { id: "trailers", title: "Прицепы", href: "/shop/trailers", imageUrl: "/trailers.jpg" },
  { id: "comfort", title: "Комфорт", href: "/shop/comfort", imageUrl: "/comfort.jpg" },
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

function activeArticle(host: ParentNode) {
  const article = [...host.querySelectorAll("article")].find((node) => node.getAttribute("aria-hidden") !== "true");
  if (!article) throw new Error("active slide missing");
  return article;
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

describe("ShopCategoryCarousel", () => {
  let host: HTMLDivElement;
  let root: Root;

  afterEach(async () => {
    await act(async () => {
      root?.unmount();
    });
    host?.remove();
    vi.useRealTimers();
  });

  async function renderCarousel(
    nextSlides: readonly ShopHomeCarouselSlide[],
    children?: ReactNode,
    reduced = false,
  ) {
    installMotion(reduced);
    host = document.createElement("div");
    document.body.appendChild(host);
    root = createRoot(host);
    await act(async () => {
      root.render(createElement(ShopCategoryCarousel, { slides: nextSlides }, children));
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

  it("keeps links in inactive slides out of tab order", async () => {
    await renderCarousel(slides);

    const hiddenLinks = [...host.querySelectorAll<HTMLAnchorElement>("article[aria-hidden='true'] a")];
    expect(hiddenLinks.map((link) => link.textContent)).toEqual(["Прицепы", "Комфорт"]);
    for (const link of hiddenLinks) {
      expect(link.tabIndex).toBe(-1);
      expect(link.closest("article")?.getAttribute("aria-hidden")).toBe("true");
    }

    const current = activeArticle(host);
    expect(current.querySelector("a")?.tabIndex).toBe(0);
    expect(current.getAttribute("aria-hidden")).toBe("false");

    await clickControl("Следующий кадр");
    expect(activeArticle(host).querySelector("a")?.textContent).toBe("Прицепы");
    expect(activeArticle(host).querySelector("a")?.tabIndex).toBe(0);
    expect([...host.querySelectorAll<HTMLAnchorElement>("article[aria-hidden='true'] a")].map((link) => link.tabIndex)).toEqual([-1, -1]);
  });

  it("stops autoplay when a control inside the carousel receives focus", async () => {
    vi.useFakeTimers();
    await renderCarousel(slides.slice(0, 2));

    await act(async () => {
      vi.advanceTimersByTime(7000);
    });
    expect(activeArticle(host).querySelector("a")?.textContent).toBe("Прицепы");

    const control = host.querySelector("button");
    if (!control) throw new Error("control missing");
    await act(async () => {
      control.focus();
    });
    await act(async () => {
      vi.advanceTimersByTime(7000);
    });
    expect(activeArticle(host).querySelector("a")?.textContent).toBe("Прицепы");
  });

  it("ignores a swipe when the vertical movement is larger than the horizontal", async () => {
    await renderCarousel(slides.slice(0, 2));
    await swipe({ x: 0, y: 0 }, { x: -60, y: 200 });
    expect(activeArticle(host).querySelector("a")?.textContent).toBe("Масла");
  });

  it("moves one slide on a horizontal swipe and leaves a short swipe in place", async () => {
    await renderCarousel(slides);
    await swipe({ x: 100, y: 20 }, { x: 40, y: 32 });
    expect(activeArticle(host).querySelector("a")?.textContent).toBe("Прицепы");

    await swipe({ x: 0, y: 0 }, { x: -40, y: 0 });
    expect(activeArticle(host).querySelector("a")?.textContent).toBe("Прицепы");
  });

  it("treats an equal horizontal and vertical movement as a swipe", async () => {
    await renderCarousel(slides.slice(0, 2));
    await swipe({ x: 80, y: 80 }, { x: 20, y: 20 });
    expect(activeArticle(host).querySelector("a")?.textContent).toBe("Прицепы");
  });

  it("wraps from the last slide to the first and from the first to the last", async () => {
    await renderCarousel(slides);

    await clickControl("Предыдущий кадр");
    expect(activeArticle(host).querySelector("a")?.textContent).toBe("Комфорт");

    await swipe({ x: 0, y: 10 }, { x: -70, y: 16 });
    expect(activeArticle(host).querySelector("a")?.textContent).toBe("Масла");

    await clickControl("Предыдущий кадр");
    expect(activeArticle(host).querySelector("a")?.textContent).toBe("Комфорт");
  });

  it("shows no controls and does not autoplay for zero or one slide", async () => {
    await renderCarousel([]);
    expect(host.querySelector("[aria-roledescription='carousel']")).toBeNull();

    await act(async () => {
      root.render(createElement(ShopCategoryCarousel, { slides: [] }, createElement("p", null, "Сетка")));
    });
    expect(host.textContent).toContain("Сетка");
    expect(host.querySelector("button")).toBeNull();

    await act(async () => {
      root.render(createElement(ShopCategoryCarousel, { slides: slides.slice(0, 1) }));
    });
    expect(host.querySelector("button")).toBeNull();
    expect(host.querySelectorAll("a")).toHaveLength(1);

    vi.useFakeTimers();
    await act(async () => {
      vi.advanceTimersByTime(14000);
    });
    expect(activeArticle(host).querySelector("a")?.textContent).toBe("Масла");
  });

  it("does not autoplay when the user prefers reduced motion", async () => {
    vi.useFakeTimers();
    await renderCarousel(slides.slice(0, 2), undefined, true);
    await act(async () => {
      vi.advanceTimersByTime(21000);
    });
    expect(activeArticle(host).querySelector("a")?.textContent).toBe("Масла");
  });

  it("stops autoplay after a pointer control chooses a slide", async () => {
    vi.useFakeTimers();
    await renderCarousel(slides.slice(0, 2));
    await act(async () => {
      vi.advanceTimersByTime(7000);
    });
    await clickControl("Следующий кадр");
    expect(activeArticle(host).querySelector("a")?.textContent).toBe("Масла");
    await act(async () => {
      vi.advanceTimersByTime(21000);
    });
    expect(activeArticle(host).querySelector("a")?.textContent).toBe("Масла");
  });

  it("keeps a clicked slide when an autoplay tick is still pending", async () => {
    vi.useFakeTimers();
    await renderCarousel(slides);
    await act(async () => {
      vi.advanceTimersByTime(6999);
    });
    expect(activeArticle(host).querySelector("a")?.textContent).toBe("Масла");

    await clickControl("Показать Комфорт");
    expect(activeArticle(host).querySelector("a")?.textContent).toBe("Комфорт");

    await act(async () => {
      vi.advanceTimersByTime(7000);
    });
    expect(activeArticle(host).querySelector("a")?.textContent).toBe("Комфорт");
  });

  it("keeps the visible slide when focus arrives before a pending autoplay tick", async () => {
    vi.useFakeTimers();
    await renderCarousel(slides.slice(0, 2));
    await act(async () => {
      vi.advanceTimersByTime(6999);
    });
    expect(activeArticle(host).querySelector("a")?.textContent).toBe("Масла");

    const control = host.querySelector("button");
    if (!control) throw new Error("control missing");
    await act(async () => {
      control.focus();
    });
    await act(async () => {
      vi.advanceTimersByTime(7000);
    });
    expect(activeArticle(host).querySelector("a")?.textContent).toBe("Масла");
  });
});
