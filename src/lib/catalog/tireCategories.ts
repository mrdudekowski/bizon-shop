export type TireCategory = {
  slug: string;
  value: string;
  name: string;
  description: string;
  icon: string;
};

export const TIRE_CATEGORIES: TireCategory[] = [
  { slug: "long-haul", value: "long_haul", name: "Long Haul", description: "Магистральные перевозки и длинные маршруты.", icon: "/images/application/long-haul-m.svg" },
  { slug: "regional", value: "regional", name: "Regional", description: "Региональные маршруты и смешанная дорожная эксплуатация.", icon: "/images/application/regional-m.svg" },
  { slug: "off-road", value: "off_road", name: "Off-Road", description: "Бездорожье, грунтовые дороги и сложные покрытия.", icon: "/images/application/off-road-m.svg" },
  { slug: "construction", value: "construction", name: "Construction", description: "Строительная техника и тяжёлые условия работы.", icon: "/images/application/construction-m.svg" },
  { slug: "urban", value: "urban", name: "Urban", description: "Городская эксплуатация с частыми остановками и манёврами.", icon: "/images/application/urban-m.svg" },
];

export function getTireCategoryBySlug(slug: string): TireCategory | undefined {
  return TIRE_CATEGORIES.find((category) => category.slug === slug);
}

export function getTireCategoryByValue(value: string): TireCategory | undefined {
  return TIRE_CATEGORIES.find((category) => category.value === value);
}

export function getModelApplicationValues(model: {
  applicationTypes?: readonly string[];
}): string[] {
  const allowed = new Set(TIRE_CATEGORIES.map((category) => category.value));
  const values = (model.applicationTypes ?? [])
    .filter((value) => typeof value === "string" && value.trim() !== "")
    .map((value) => value.trim().toLowerCase().replaceAll("-", "_"))
    .filter((value) => allowed.has(value));
  return [...new Set(values)];
}

export function getModelApplicationCategories(model: {
  applicationTypes?: readonly string[];
}): TireCategory[] {
  const normalized = new Set(getModelApplicationValues(model));
  return TIRE_CATEGORIES.filter((category) => normalized.has(category.value));
}

export function getModelApplicationLabels(model: {
  applicationTypes?: readonly string[];
}): string[] {
  return getModelApplicationValues(model).map(
    (value) => getTireCategoryByValue(value)?.name ?? value,
  );
}
