// @vitest-environment happy-dom
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it } from "vitest";

import type { CmsWheelModel, CmsWheelVariant } from "@/lib/content/types";
import { WheelVariantsTable } from "./WheelVariantsTable";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

describe("WheelVariantsTable", () => {
  let host: HTMLDivElement;
  let root: Root;

  afterEach(async () => {
    await act(async () => root?.unmount());
    host?.remove();
  });

  it("reveals all configured wheel variant fields when expanded", async () => {
    const variant: CmsWheelVariant = {
      id: "variant-1",
      modelId: "model-1",
      sizeLabel: "22.5×8.25",
      sku: "BIZON-225",
      diameter: 22.5,
      width: 8.25,
      boltHoles: 10,
      pcd: "10×335",
      pcdMm: 335,
      offsetET: 120,
      centerBore: 281,
      loadRating: "4500 кг",
      weight: 38.5,
      color: "Серебристый",
      finish: "Порошковая окраска",
      fastenerType: "Шпилька",
      fastenerMaterial: "Сталь",
      sourceSpecification: "Паспорт изделия",
      compatibleTireSizes: "315/80 R22.5",
      available: true,
      price: 12500,
      priceOnRequest: false,
    };
    host = document.createElement("div");
    document.body.appendChild(host);
    root = createRoot(host);
    await act(async () => {
      root.render(createElement(WheelVariantsTable, {
        model: {} as CmsWheelModel,
        variants: [variant],
        modelPath: "/wheels/model/",
      }));
    });

    expect(host.textContent).not.toContain("Шпилька");
    const toggle = host.querySelector<HTMLButtonElement>("button");
    if (!toggle) throw new Error("wheel specification toggle missing");
    await act(async () => toggle.click());

    for (const value of [
      "BIZON-225", "10", "335", "38.5", "Шпилька", "Сталь",
      "Паспорт изделия", "315/80 R22.5", "12500", "4500 кг",
    ]) {
      expect(host.textContent).toContain(value);
    }
  });
});
