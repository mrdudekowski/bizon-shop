import { TIRE_APPLICATION_CATEGORIES } from "@/collections/fields/constants";

export function getApplicationCategoryLabel(value: string): string {
  const match = TIRE_APPLICATION_CATEGORIES.find((item) => item.value === value);
  return match?.label ?? value;
}
