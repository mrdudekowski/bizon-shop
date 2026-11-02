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

/** Steer, drive, and trailer share this topic. Published taxonomy has no per-axis value. */
export const TIRE_IQ_AXLES_KNOWLEDGE_HREF = "/tire-iq?topic=axles#knowledge";

export type TireIqAxis = "steer" | "drive" | "trailer";

/** Keep the user's selected axis in the route without claiming articles have per-axis taxonomy. */
export function getTireIqAxisKnowledgeHref(axis: TireIqAxis): string {
  return `/tire-iq?topic=axles&axis=${axis}#knowledge`;
}

export function getTireIqTaxonomyLabel(value: string): string {
  return TIRE_IQ_TAXONOMY.find((topic) => topic.value === value)?.label ?? value;
}
