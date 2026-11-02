// @vitest-environment happy-dom
import { act, createElement, useLayoutEffect } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it } from "vitest";

import type { TireCatalogModel } from "@/lib/catalog/tireReadModel";
import { AssortmentCarousel } from "./AssortmentCarousel";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const models = ["one", "two", "three"].map((slug) => ({
  id: slug,
  slug,
  name: `Model ${slug}`,
  tireTypeSlug: "tbr",
  tireTypeName: "TBR",
  applicationTypes: [],
  brand: "BIZON",
  descriptionShort: "",
  descriptionLong: "",
  imageUrl: `/images/${slug}.jpg`,
  gallery: [],
  advantages: [],
  documents: [],
  selectionAxles: [],
  showInMenu: true,
  menuOrder: 0,
  href: `/models/tbr/${slug}`,
  sizes: [],
})) as TireCatalogModel[];

function LayoutHarness() {
  useLayoutEffect(() => {
    const track = document.querySelector<HTMLElement>("[aria-label='Ключевые модели шин']");
    if (!track) return;
    [...track.children].forEach((card, index) => {
      Object.defineProperty(card, "offsetLeft", { configurable: true, value: index * 180 });
    });
  }, []);

  return createElement(AssortmentCarousel, { models });
}

describe("AssortmentCarousel loop integration", () => {
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

  it("keeps the three-card Home strip cyclic without putting clone cards in tab order", async () => {
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

    const track = host.querySelector<HTMLElement>("[aria-label='Ключевые модели шин']");
    if (!track) throw new Error("assortment track missing");
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
