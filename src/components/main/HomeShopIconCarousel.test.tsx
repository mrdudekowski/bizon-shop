// @vitest-environment happy-dom
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";
import { HomeShopIconCarousel } from "./HomeShopIconCarousel";
import type { HomeShopCarouselItem } from "@/lib/content/homeShopCarousel";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const REDUCE_MOTION = "(prefers-reduced-motion: reduce)";
const TICK_MS = 6000;
const items: HomeShopCarouselItem[] = [
  { id: "wheels", title: "Диски", caption: "Кованые диски", iconUrl: "/tire.svg", iconAlt: "" },
  { id: "outdoor", title: "Кемпинг", caption: "Для маршрута", iconUrl: "/camp.svg", iconAlt: "" },
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
    dispatchEvent() { return false; },
  })) as typeof window.matchMedia;
}

describe("HomeShopIconCarousel", () => {
  let host: HTMLDivElement;
  let root: Root;

  afterEach(async () => {
    await act(async () => root?.unmount());
    host?.remove();
    vi.useRealTimers();
  });

  async function renderCarousel(reduced = false, carouselItems = items) {
    installMotion(reduced);
    host = document.createElement("div");
    document.body.appendChild(host);
    root = createRoot(host);
    await act(async () => root.render(createElement(HomeShopIconCarousel, { items: carouselItems })));
  }

  it("shows the first disk icon and caption on initial render", async () => {
    await renderCarousel();
    expect(host.querySelector("img")?.getAttribute("src")).toBe("/tire.svg");
    expect(host.textContent).toContain("Кованые диски");
    expect(host.querySelector("button, a")).toBeNull();
  });

  it("advances automatically and wraps to the first item without manual controls", async () => {
    vi.useFakeTimers();
    await renderCarousel();
    const tile = host.querySelector("[data-home-shop-icon-tile]");
    await act(async () => vi.advanceTimersByTime(TICK_MS));
    expect(Array.from(host.querySelectorAll("img")).map((image) => image.getAttribute("src"))).toEqual(["/tire.svg", "/camp.svg"]);
    expect(host.querySelector("[data-home-shop-icon-tile]")).toBe(tile);
    expect(host.querySelector('[data-home-shop-caption="outgoing"]')?.textContent).toBe("Кованые диски");
    expect(host.querySelector('[data-home-shop-caption="incoming"]')?.textContent).toBe("Для маршрута");
    expect(host.textContent).toContain("Кованые диски");

    const incomingIcon = host.querySelector('img[data-home-shop-icon="incoming"]');
    expect(incomingIcon).not.toBeNull();
    await act(async () => incomingIcon?.dispatchEvent(new Event("animationend", { bubbles: true })));
    expect(host.querySelectorAll("img")).toHaveLength(1);
    expect(host.querySelector("img")?.getAttribute("src")).toBe("/camp.svg");
    expect(host.querySelectorAll("[data-home-shop-caption]")).toHaveLength(1);
    expect(host.textContent).toContain("Для маршрута");

    await act(async () => vi.advanceTimersByTime(TICK_MS));
    expect(Array.from(host.querySelectorAll("img")).map((image) => image.getAttribute("src"))).toEqual(["/camp.svg", "/tire.svg"]);
    expect(host.querySelector('[data-home-shop-caption="incoming"]')?.textContent).toBe("Кованые диски");
    const nextIncomingIcon = host.querySelector('img[data-home-shop-icon="incoming"]');
    await act(async () => nextIncomingIcon?.dispatchEvent(new Event("animationend", { bubbles: true })));
    expect(host.querySelector("img")?.getAttribute("src")).toBe("/tire.svg");
    expect(host.querySelector("button, a")).toBeNull();
  });

  it("keeps the first item stable for reduced-motion users", async () => {
    vi.useFakeTimers();
    await renderCarousel(true);
    await act(async () => vi.advanceTimersByTime(TICK_MS * 3));
    expect(host.querySelector("img")?.getAttribute("src")).toBe("/tire.svg");
    expect(host.textContent).toContain("Кованые диски");
  });
});
