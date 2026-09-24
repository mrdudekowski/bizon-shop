export const TIRE_IQ_TAXONOMY = [
  { label: "Подбор", value: "selection" },
  { label: "Износ", value: "wear" },
  { label: "Давление", value: "pressure" },
  { label: "Нагрузка", value: "load" },
  { label: "Оси", value: "axles" },
  { label: "Карьер", value: "quarry" },
  { label: "Строительство", value: "construction" },
  { label: "TCO", value: "tco" },
  { label: "Диагностика", value: "diagnostics" },
] as const;

export type TireIqTaxonomyValue = (typeof TIRE_IQ_TAXONOMY)[number]["value"];

export function getTireIqTaxonomyLabel(value: string): string {
  return TIRE_IQ_TAXONOMY.find((topic) => topic.value === value)?.label ?? value;
}
