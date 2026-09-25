export type TireCategory = {
  slug: string;
  value: string;
  name: string;
  description: string;
};

export const TIRE_CATEGORIES: TireCategory[] = [
  { slug: "long-haul", value: "long_haul", name: "Long Haul", description: "Магистральные перевозки и длинные маршруты." },
  { slug: "regional", value: "regional", name: "Regional", description: "Региональные маршруты и смешанная дорожная эксплуатация." },
  { slug: "off-road", value: "off_road", name: "Off-Road", description: "Бездорожье, грунтовые дороги и сложные покрытия." },
  { slug: "construction", value: "construction", name: "Construction", description: "Строительная техника и тяжёлые условия работы." },
  { slug: "urban", value: "urban", name: "Urban", description: "Городская эксплуатация с частыми остановками и манёврами." },
];

export function getTireCategoryBySlug(slug: string): TireCategory | undefined {
  return TIRE_CATEGORIES.find((category) => category.slug === slug);
}

export function getTireCategoryByValue(value: string): TireCategory | undefined {
  return TIRE_CATEGORIES.find((category) => category.value === value);
}
