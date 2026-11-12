// @vitest-environment happy-dom
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { TireCatalogModel } from "@/lib/catalog/tireReadModel";
import type { CmsTireVariant } from "@/lib/content/types";
import { TireModelStage } from "./TireModelStage";

vi.mock("@/lib/content/browserPublishedClient", () => ({
  fetchBrowserPublishedJson: vi.fn(() => new Promise(() => {})),
  fetchBrowserPublishedList: vi.fn(() => new Promise(() => {})),
}));

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const emptyModel = {
  id: "model-1",
  name: "DSR188",
  slug: "dsr188",
  tireTypeSlug: "tbr",
  tireTypeName: "Грузовые шины",
  href: "/models/tbr/dsr188",
  sizes: [],
  brand: "BIZON",
  descriptionShort: "",
  descriptionLong: "",
  imageUrl: "",
  gallery: [],
  documents: [],
  advantages: [],
  selectionAxles: [],
  applicationTypes: [],
  applicationCategory: "",
  treadType: "",
  axlePosition: "",
  showInMenu: true,
  menuOrder: 0,
} as unknown as TireCatalogModel;

const SPECIALIST_SENTENCE = "Финальную совместимость, наличие и предложение подтверждает специалист BIZON.";

describe("TireModelStage", () => {
  let host: HTMLDivElement;
  let root: Root;

  afterEach(async () => {
    await act(async () => root?.unmount());
    host?.remove();
    document.body.querySelectorAll('[role="listbox"]').forEach((listbox) => listbox.remove());
  });

  it("leaves the shared price notice off the model page", () => {
    host = document.createElement("div");
    document.body.appendChild(host);
    root = createRoot(host);
    act(() => {
      root.render(createElement(TireModelStage, {
        model: { ...emptyModel },
        variants: [],
        modelPath: "/models/tbr/dsr188",
        breadcrumbs: [],
      }));
    });

    expect(host.textContent).toContain("Проверим модель под вашу технику и маршрут");
    expect(host.textContent).not.toContain(SPECIALIST_SENTENCE);
    expect(host.querySelector("[data-price-notice]")).toBeNull();
  });

  it("disambiguates same-size choices and selects the matching variant", async () => {
    const model = {
      id: "model-1",
      name: "DSR188",
      slug: "dsr188",
      tireTypeSlug: "tbr",
      tireTypeName: "Грузовые шины",
      href: "/models/tbr/dsr188",
      sizes: ["12.00R20"],
      brand: "BIZON",
      descriptionShort: "",
      descriptionLong: "",
      imageUrl: "",
      gallery: [],
      documents: [],
      advantages: [],
      selectionAxles: [],
      applicationTypes: [],
      applicationCategory: "",
      treadType: "",
      axlePosition: "",
      showInMenu: true,
      menuOrder: 0,
    } as TireCatalogModel;
    const variants: CmsTireVariant[] = [
      { id: "variant-single", size: "12.00R20", loadIndex: "154", loadIndexDual: "183", available: true, price: 18300, priceOnRequest: false },
      { id: "variant-dual", size: "12.00R20", loadIndex: "154", loadIndexDual: "153", available: true, price: 15300, priceOnRequest: false },
    ];

    host = document.createElement("div");
    document.body.appendChild(host);
    root = createRoot(host);
    await act(async () => {
      root.render(createElement(TireModelStage, { model, variants, modelPath: "/models/tbr/dsr188", breadcrumbs: [] }));
    });

    const trigger = host.querySelector<HTMLButtonElement>('[role="combobox"]');
    if (!trigger) throw new Error("variant selector missing");
    await act(async () => trigger.click());

    const options = [...document.body.querySelectorAll<HTMLElement>('[role="option"]')];
    expect(options.map((option) => option.textContent)).toContain("12.00R20 · LI dual 183");
    expect(options.map((option) => option.textContent)).toContain("12.00R20 · LI dual 153");
    const dualOption = options.find((option) => option.textContent === "12.00R20 · LI dual 153");
    if (!dualOption) throw new Error("disambiguated variant option missing");
    await act(async () => dualOption.click());

    expect(trigger.textContent).toContain("12.00R20 · LI dual 153");
    expect(host.textContent?.replace(/[\s\u00a0]+/g, " ")).toContain("15 300 ₽");
  });
});
