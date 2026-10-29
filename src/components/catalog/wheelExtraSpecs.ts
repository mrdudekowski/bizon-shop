import type { CmsWheelVariant } from "@/lib/content/types";

export type WheelExtraSpec = { label: string; value: string };

export function nextOpenSpec(currentId: string | null, id: string): string | null {
  return currentId === id ? null : id;
}

function present(value: string | number | null | undefined): string | null {
  if (value == null || value === "") return null;
  return String(value);
}

export function extraWheelSpecs(variant: CmsWheelVariant): WheelExtraSpec[] {
  const price = variant.priceOnRequest ? "По запросу" : present(variant.price);
  const rows: Array<[string, string | null]> = [
    ["Артикул", present(variant.sku)],
    ["Количество отверстий", present(variant.boltHoles)],
    ["Тип крепежа", present(variant.fastenerType)],
    ["Материал крепежа", present(variant.fastenerMaterial)],
    ["Совместимые размеры шин", present(variant.compatibleTireSizes)],
    ["Источник спецификации", present(variant.sourceSpecification)],
    ["Цена", price],
  ];
  return rows.flatMap(([label, value]) => (value == null ? [] : [{ label, value }]));
}
