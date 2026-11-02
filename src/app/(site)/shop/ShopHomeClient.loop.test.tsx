// @vitest-environment happy-dom
import { act, createElement, useLayoutEffect } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";

import { getPageDefaults } from "@/lib/content/pages/defaults";
import type { CmsWheelModel } from "@/lib/content/types";
import { ShopHomeClient } from "./ShopHomeClient";

vi.mock("@/lib/content/readPublishedRevision", () => ({
  readPublishedRevision: async () => false,
}));

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const models = ["one", "two", "three"].map((slug) => ({
  id: slug,
  slug,
  name: `Wheel ${slug}`,
  wheelTypeSlug: "forged",
  wheelTypeName: "Forged",
  descriptionShort: "",
  descriptionLong: "",
  imageUrl: `/images/${slug}.jpg`,
  showInMenu: true,
  menuOrder: 0,
  designStyle: "",
  series: "",
})) as CmsWheelModel[];

function LayoutHarness() {
  useLayoutEffect(() => {
    const first = document.querySelector<HTMLAnchorElement>('a[href="/shop/wheels/forged/one"]');
    const track = first?.parentElement;
    if (!track) return;
    [...track.children].forEach((card, index) => {
      Object.defineProperty(card, "offsetLeft", { configurable: true, value: index * 180 });
    });
  }, []);

  return createElement(ShopHomeClient, {
    initialPage: getPageDefaults("shop-home"),
    initialModels: models,
    initialCategories: [],
  });
}

describe("ShopHomeClient wheel strip loop integration", () => {
  let host: HTMLDivElement;
  let root: Root;
  let originalOnScrollEnd: PropertyDescriptor | undefined;

  afterEach(async () => {
    await act(async () => {
      root?.unmount();
    });
    host?.remove();
    if (originalOnScrollEnd) Object.defineProperty(window, "onscrollend", originalOnScrollEnd);
    else Reflect.deleteProperty(window, "onscrollend");
  });

  it("keeps the three-model Shop strip cyclic without exposing its clone cards to Tab", async () => {
    window.matchMedia = ((query: string) => ({
      matches: query === "(max-width: 1023px)",
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
    originalOnScrollEnd = Object.getOwnPropertyDescriptor(window, "onscrollend");
    Object.defineProperty(window, "onscrollend", { configurable: true, value: null });
    host = document.createElement("div");
    document.body.appendChild(host);
    root = createRoot(host);

    await act(async () => {
      root.render(createElement(LayoutHarness));
    });

    const firstCard = host.querySelector<HTMLAnchorElement>('a[href="/shop/wheels/forged/one"]');
    const track = firstCard?.parentElement;
    if (!track) throw new Error("Shop model track missing");
    expect(track.children).toHaveLength(6);
    expect(track.scrollLeft).toBe(540);
    expect([...track.children].slice(3).every((card) => card.getAttribute("aria-hidden") === "true" && (card as HTMLElement).tabIndex === -1)).toBe(true);

    await act(async () => {
      track.scrollLeft = 0;
      track.dispatchEvent(new Event("scrollend"));
    });
    expect(track.scrollLeft).toBe(540);

    await act(async () => {
      track.scrollLeft = 720;
      track.dispatchEvent(new Event("scrollend"));
    });
    expect(track.scrollLeft).toBe(180);
  });
});
