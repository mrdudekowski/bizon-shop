// @vitest-environment happy-dom
import { act, createElement } from "react";
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

function activeHref(host: ParentNode) {
  return host.querySelector("[data-slot='0'] a")?.getAttribute("href");
}

describe("AssortmentCarousel loop", () => {
  let host: HTMLDivElement;
  let root: Root;

  afterEach(async () => {
    await act(async () => {
      root?.unmount();
    });
    host?.remove();
  });

  it("pages the real cards forever in either direction", async () => {
    host = document.createElement("div");
    document.body.appendChild(host);
    root = createRoot(host);
    await act(async () => {
      root.render(createElement(AssortmentCarousel, { models }));
    });

    const links = [...host.querySelectorAll("a")].map((link) => link.getAttribute("href"));
    expect(links).toEqual(["/models/tbr/one", "/models/tbr/two", "/models/tbr/three"]);
    expect(host.querySelectorAll("[data-active]")).toHaveLength(3);
    expect(activeHref(host)).toBe("/models/tbr/one");
    expect(host.querySelectorAll("[data-slot][aria-hidden='true']")).toHaveLength(2);

    const next = host.querySelector<HTMLButtonElement>("[aria-label='Следующая карточка']");
    if (!next) throw new Error("cue missing");
    expect(host.querySelector("[aria-label='Предыдущая карточка']")).toBeNull();

    await act(async () => {
      next.click();
    });
    expect(activeHref(host)).toBe("/models/tbr/two");

    await act(async () => {
      next.click();
      next.click();
    });
    expect(activeHref(host)).toBe("/models/tbr/one");

    const region = host.querySelector("[aria-roledescription='carousel']");
    if (!region) throw new Error("carousel missing");
    await act(async () => {
      region.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowLeft", bubbles: true }));
    });
    expect(activeHref(host)).toBe("/models/tbr/three");

    await act(async () => {
      const trackpadSwipe = new WheelEvent("wheel", { deltaX: 80, deltaY: 4, bubbles: true, cancelable: true });
      region.dispatchEvent(trackpadSwipe);
      region.dispatchEvent(trackpadSwipe);
    });
    expect(activeHref(host)).toBe("/models/tbr/one");

    await act(async () => {
      region.dispatchEvent(new WheelEvent("wheel", { deltaX: 4, deltaY: 80, bubbles: true, cancelable: true }));
    });
    expect(activeHref(host)).toBe("/models/tbr/one");
  });
});
