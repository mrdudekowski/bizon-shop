import { describe, expect, it } from "vitest";

import type { CmsWheelVariant } from "@/lib/content/types";

import { extraWheelSpecs, nextOpenSpec } from "./wheelExtraSpecs";

function variant(patch: Partial<CmsWheelVariant> = {}): CmsWheelVariant {
  return {
    id: "v1",
    modelId: "m1",
    sizeLabel: "18×9",
    available: true,
    priceOnRequest: true,
    pcd: "6×139.7",
    offsetET: 12,
    centerBore: 106.1,
    loadRating: "1150 кг",
    weight: 11.4,
    color: "Satin Black",
    finish: "Матовый чёрный",
    ...patch,
  };
}

describe("extraWheelSpecs", () => {
  it("keeps the fields that are not already columns in the size table", () => {
    expect(extraWheelSpecs(variant({
      sku: "BZN-ATL-1890",
      boltHoles: 6,
      pcdMm: 139.7,
      fastenerType: "Коническая гайка",
      fastenerMaterial: "Сталь",
      compatibleTireSizes: "275/65 R18",
      sourceSpecification: "ET12",
    })).map((row) => row.label)).toEqual([
      "Артикул",
      "Количество отверстий",
      "Тип крепежа",
      "Материал крепежа",
      "Совместимые размеры шин",
      "Источник спецификации",
      "Цена",
    ]);
  });

  it("drops an extra field that has no value", () => {
    expect(extraWheelSpecs(variant({ sku: "BZN" })).map((row) => row.label)).toEqual(["Артикул", "Цена"]);
  });
});

describe("nextOpenSpec", () => {
  it("opens one specification and closes the one that was open", () => {
    expect(nextOpenSpec(null, "a")).toBe("a");
    expect(nextOpenSpec("a", "b")).toBe("b");
    expect(nextOpenSpec("b", "b")).toBeNull();
  });
});
