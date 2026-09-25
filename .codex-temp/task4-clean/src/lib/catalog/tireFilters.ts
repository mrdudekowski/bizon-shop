import { TIRE_CATEGORIES } from "@/lib/catalog/tireCategories";
import { AXLE_OPTIONS, type CatalogAxle } from "@/lib/selection/options";

export type TireFilters = {
  application?: string;
  axle?: CatalogAxle;
  size?: string;
};

type SearchParamsInput =
  | URLSearchParams
  | Record<string, string | string[] | undefined>;

type FilterableTireModel = {
  applicationCategory: string;
  selectionAxles: readonly string[];
  sizes: readonly string[];
};

const APPLICATION_VALUES = new Set(
  TIRE_CATEGORIES.map((category) => category.value),
);
const AXLE_VALUES = new Set<string>(AXLE_OPTIONS.map((option) => option.value));

function getFirstValue(input: SearchParamsInput, key: string): string | undefined {
  const value = input instanceof URLSearchParams ? input.get(key) : input[key];
  if (Array.isArray(value)) return value[0];
  return value ?? undefined;
}

export function parseTireFilters(input: SearchParamsInput): TireFilters {
  const filters: TireFilters = {};
  const application = getFirstValue(input, "application")?.trim();
  const axle = getFirstValue(input, "axle")?.trim();
  const size = getFirstValue(input, "size")?.trim();

  if (application && APPLICATION_VALUES.has(application)) {
    filters.application = application;
  }
  if (axle && AXLE_VALUES.has(axle)) {
    filters.axle = axle as CatalogAxle;
  }
  if (size) filters.size = size;

  return filters;
}

export function filterTireModels<T extends FilterableTireModel>(
  models: readonly T[],
  filters: TireFilters,
): T[] {
  const normalizedSize = filters.size?.trim().toLocaleLowerCase("ru-RU");

  return models.filter((model) => {
    if (
      filters.application &&
      model.applicationCategory !== filters.application
    ) {
      return false;
    }
    if (filters.axle && !model.selectionAxles.includes(filters.axle)) {
      return false;
    }
    if (
      normalizedSize &&
      !model.sizes.some(
        (size) => size.trim().toLocaleLowerCase("ru-RU") === normalizedSize,
      )
    ) {
      return false;
    }
    return true;
  });
}
