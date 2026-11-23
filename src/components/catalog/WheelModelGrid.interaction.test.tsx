// @vitest-environment happy-dom
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it } from "vitest";

import type { CmsWheelVariant } from "@/lib/content/types";
import { WheelModelGrid } from "./WheelModelGrid";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

describe("WheelModelGrid live filters", () => {
  let host: HTMLDivElement;
  let root: Root;

  afterEach(async () => {
    await act(async () => root?.unmount());
    host?.remove();
    window.history.replaceState(window.history.state, "", "/");
  });

  const models = [
    { id: "model-1", slug: "m1", name: "M1", wheelTypeSlug: "forged", wheelTypeName: "Forged", descriptionShort: "", descriptionLong: "", gallery: [], showInMenu: true, menuOrder: 1 },
    { id: "model-2", slug: "m2", name: "M2", wheelTypeSlug: "forged", wheelTypeName: "Forged", descriptionShort: "", descriptionLong: "", gallery: [], showInMenu: true, menuOrder: 2 },
  ];

  const variants: CmsWheelVariant[] = [
    { id: "variant-1", modelId: "model-1", sizeLabel: "22 x 9", diameter: 22, width: 9, pcd: "8x180", offsetET: 0, centerBore: 130, color: "Черный", priceOnRequest: false, available: true },
    { id: "variant-2", modelId: "model-2", sizeLabel: "24 x 10", diameter: 24, width: 10, pcd: "8x180", offsetET: 0, centerBore: 130, color: "Черный", priceOnRequest: false, available: true },
  ];

  it("updates query state immediately and does not render an apply button", async () => {
    host = document.createElement("div");
    document.body.appendChild(host);
    root = createRoot(host);

    await act(async () => {
      root.render(createElement(WheelModelGrid, { models, variants, typeBasePath: "/shop/wheels/forged" }));
    });

    const group = host.querySelector<HTMLElement>('[role="group"][aria-label="Фильтры каталога дисков"]');
    expect(group?.querySelector('button[type="submit"]')).toBeNull();
    const trigger = group?.querySelector<HTMLButtonElement>('button[role="combobox"]');
    if (!trigger) throw new Error("diameter filter trigger missing");

    await act(async () => trigger.click());
    const option = [...document.querySelectorAll<HTMLElement>('[role="option"]')]
      .find((candidate) => candidate.textContent?.trim() === "22");
    if (!option) throw new Error("diameter option missing");
    await act(async () => option.click());

    expect(new URLSearchParams(window.location.search).get("diameter")).toBe("22");
    expect(host.textContent).toContain("1 модель");
    const widthTrigger = group?.querySelectorAll<HTMLButtonElement>('button[role="combobox"]')[1];
    if (!widthTrigger) throw new Error("width filter trigger missing");
    await act(async () => widthTrigger.click());
    const widthOption = [...document.querySelectorAll<HTMLElement>('[role="option"]')]
      .find((candidate) => candidate.textContent?.trim() === "10");
    if (!widthOption) throw new Error("width option missing");
    await act(async () => widthOption.click());
    expect(new URLSearchParams(window.location.search).get("width")).toBe("10");
    expect(host.textContent).toContain("Не нашли подходящую модель?");
    expect(host.textContent).toContain("помочь с подбором");
    expect(host.textContent).toContain("Не нашли подходящую модель?");
    expect(host.textContent).toContain("помочь с подбором");
  });

  it("updates the mobile count and leaves the filter sheet open", async () => {
    host = document.createElement("div");
    document.body.appendChild(host);
    root = createRoot(host);

    await act(async () => {
      root.render(createElement(WheelModelGrid, { models, variants, typeBasePath: "/shop/wheels/forged" }));
    });

    const trigger = [...host.querySelectorAll<HTMLButtonElement>("button")]
      .find((button) => button.textContent?.trim() === "Фильтры");
    if (!trigger) throw new Error("mobile filter trigger missing");
    await act(async () => trigger.click());

    const sheet = host.querySelector<HTMLElement>('[role="dialog"]');
    const mobileGroup = sheet?.querySelector<HTMLElement>('[role="group"][aria-label="Параметры диска"]');
    const mobileSelect = mobileGroup?.querySelector<HTMLButtonElement>('button[role="combobox"]');
    if (!sheet || !mobileSelect) throw new Error("mobile filter sheet or control missing");
    expect(mobileGroup?.querySelector('button[type="submit"]')).toBeNull();

    await act(async () => mobileSelect.click());
    const option = [...document.querySelectorAll<HTMLElement>('[role="option"]')]
      .find((candidate) => candidate.textContent?.trim() === "22");
    if (!option) throw new Error("diameter option missing");
    await act(async () => option.click());

    expect(sheet.isConnected).toBe(true);
    expect(sheet.querySelector('[aria-live="polite"]')?.textContent).toContain("Найдено: 1 модель");
    expect(new URLSearchParams(window.location.search).get("diameter")).toBe("22");
  });
});
