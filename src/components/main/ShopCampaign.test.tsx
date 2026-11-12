// @vitest-environment happy-dom
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ShopCampaign } from "./ShopCampaign";
import type { HomeShopCarouselItem } from "@/lib/content/homeShopCarousel";
import type { HomeShopCampaignContent } from "@/lib/content/pages/types";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const REDUCE_MOTION = "(prefers-reduced-motion: reduce)";
const TICK_MS = 6000;
const carouselItems: HomeShopCarouselItem[] = [
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

function campaign(frames: { imageUrl: string; imageAlt: string }[]): HomeShopCampaignContent {
  return {
    eyebrow: "BIZON SHOP",
    title: "Кованые диски",
    lead: "Смена кадра",
    imageUrl: frames[0]?.imageUrl ?? null,
    imageAlt: frames[0]?.imageAlt ?? "",
    frames,
    cta: { label: "В магазин", href: "/shop" },
  };
}

describe("ShopCampaign", () => {
  let host: HTMLDivElement;
  let root: Root;

  afterEach(async () => {
    await act(async () => root?.unmount());
    host?.remove();
    vi.useRealTimers();
  });

  async function renderCampaign(content: HomeShopCampaignContent, reduced = false, items = carouselItems) {
    installMotion(reduced);
    host = document.createElement("div");
    document.body.appendChild(host);
    root = createRoot(host);
    await act(async () => root.render(createElement(ShopCampaign, { content, carouselItems: items })));
  }

  it("keeps the first configured background frame static and preserves the CTA", async () => {
    vi.useFakeTimers();
    await renderCampaign(campaign([
      { imageUrl: "/first.jpg", imageAlt: "Первый фон" },
      { imageUrl: "/second.jpg", imageAlt: "Второй фон" },
    ]));

    const background = host.querySelector("[data-static-background]");
    expect(background?.querySelectorAll("img")).toHaveLength(1);
    expect(host.querySelectorAll("[data-static-background]")).toHaveLength(1);
    expect(host.querySelector(".shopPager")).toBeNull();
    expect(host.querySelector("a")?.textContent).toContain("В магазин");
    expect(host.textContent).not.toContain("Смена кадра");
    expect(host.querySelector("[data-home-shop-icon]")?.getAttribute("src")).toBe("/tire.svg");

    await act(async () => vi.advanceTimersByTime(TICK_MS));
    expect(background?.querySelectorAll("img")).toHaveLength(1);
    expect(host.querySelector("[data-home-shop-icon]")?.getAttribute("src")).toBe("/camp.svg");
  });

  it("uses the primary campaign image when the frame list is empty", async () => {
    await renderCampaign({ ...campaign([]), imageUrl: "/primary.jpg", imageAlt: "Основной фон" });
    expect(host.querySelector("[data-static-background] img")).toBeTruthy();
  });

  it("never renders the retired lower campaign lead, even without carousel items", async () => {
    const content = { ...campaign([]), lead: "Кованые диски и аксессуары для вашего авто" };
    await renderCampaign(content, false, []);

    expect(host.textContent).not.toContain(content.lead);
  });
});
