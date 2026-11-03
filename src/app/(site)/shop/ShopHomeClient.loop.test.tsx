// @vitest-environment happy-dom
import { act, createElement } from "react";
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

function activeHref(host: ParentNode) {
  return host.querySelector("#wheels [data-slot='0'] a")?.getAttribute("href");
}

describe("ShopHomeClient wheel carousel", () => {
  let host: HTMLDivElement;
  let root: Root;

  afterEach(async () => {
    await act(async () => {
      root?.unmount();
    });
    host?.remove();
  });

  it("pages the real wheel cards forever in either direction", async () => {
    host = document.createElement("div");
    document.body.appendChild(host);
    root = createRoot(host);
    await act(async () => {
      root.render(createElement(ShopHomeClient, {
        initialPage: getPageDefaults("shop-home"),
        initialModels: models,
        initialCategories: [],
      }));
    });

    const links = [...host.querySelectorAll("#wheels a")].map((link) => link.getAttribute("href"));
    expect(links).toEqual([
      "/shop/wheels/forged/one",
      "/shop/wheels/forged/two",
      "/shop/wheels/forged/three",
    ]);
    expect(host.querySelectorAll("#wheels [data-active]")).toHaveLength(3);
    expect(activeHref(host)).toBe("/shop/wheels/forged/one");

    const next = host.querySelector<HTMLButtonElement>("#wheels [aria-label='Следующая карточка']");
    if (!next) throw new Error("cue missing");
    expect(host.querySelector("#wheels [aria-label='Предыдущая карточка']")).toBeNull();

    const region = host.querySelector("#wheels [aria-roledescription='carousel']");
    if (!region) throw new Error("carousel missing");
    await act(async () => {
      region.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowLeft", bubbles: true }));
    });
    expect(activeHref(host)).toBe("/shop/wheels/forged/three");

    await act(async () => {
      next.click();
    });
    expect(activeHref(host)).toBe("/shop/wheels/forged/one");
  });
});
