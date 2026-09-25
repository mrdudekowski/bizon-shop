const LABELS: Record<string, string> = {
  forged: "Кованый",
  cast: "Литой",
  flow_formed: "Flow-formed",
  steel: "Стальной",
  other: "Другое",
};

export function getWheelConstructionMethodLabel(value?: string | null): string {
  if (!value) return "";
  return LABELS[value] ?? value;
}
