import type { CmsWheelModel, CmsWheelVariant } from "@/lib/content/types";

export type WheelFilters = {
  series?: string;
  designStyle?: string;
  diameter?: string;
  width?: string;
  pcd?: string;
  offsetET?: string;
  centerBore?: string;
  color?: string;
  priceOnRequest?: "yes" | "no";
};

export type WheelFilterOptions = {
  series: string[];
  designStyle: string[];
  diameter: string[];
  width: string[];
  pcd: string[];
  offsetET: string[];
  centerBore: string[];
  color: string[];
  priceOnRequest: string[];
};

type SearchParamsInput = URLSearchParams | Record<string, string | string[] | undefined>;

const MODEL_FILTERS = ["series", "designStyle"] as const;

const VALUE_FILTERS = [
  "diameter",
  "width",
  "pcd",
  "offsetET",
  "centerBore",
  "color",
] as const;

function valuesFor(variants: readonly CmsWheelVariant[], key: (typeof VALUE_FILTERS)[number]): string[] {
  const values = new Set<string>();
  for (const variant of variants) {
    const value = variant[key];
    if (value == null || value === "") continue;
    values.add(String(value));
  }
  return [...values].sort((a, b) => a.localeCompare(b, "ru", { numeric: true }));
}

function modelValuesFor(models: readonly CmsWheelModel[], key: (typeof MODEL_FILTERS)[number]): string[] {
  const values = new Set<string>();
  for (const model of models) {
    const value = model[key]?.trim();
    if (value) values.add(value);
  }
  return [...values].sort((a, b) => a.localeCompare(b, "ru", { numeric: true }));
}

export function getWheelFilterOptions(
  models: readonly CmsWheelModel[],
  variants: readonly CmsWheelVariant[],
): WheelFilterOptions {
  const hasRequestPrice = variants.some((variant) => variant.priceOnRequest);
  const hasListedPrice = variants.some((variant) => !variant.priceOnRequest);

  return {
    series: modelValuesFor(models, "series"),
    designStyle: modelValuesFor(models, "designStyle"),
    diameter: valuesFor(variants, "diameter"),
    width: valuesFor(variants, "width"),
    pcd: valuesFor(variants, "pcd"),
    offsetET: valuesFor(variants, "offsetET"),
    centerBore: valuesFor(variants, "centerBore"),
    color: valuesFor(variants, "color"),
    priceOnRequest: hasRequestPrice && hasListedPrice ? ["yes", "no"] : [],
  };
}

function firstValue(input: SearchParamsInput, key: string): string | undefined {
  const value = input instanceof URLSearchParams ? input.get(key) : input[key];
  return Array.isArray(value) ? value[0] : value;
}

export function parseWheelFilters(
  input: SearchParamsInput,
  models: readonly CmsWheelModel[],
  variants: readonly CmsWheelVariant[],
): WheelFilters {
  const options = getWheelFilterOptions(models, variants);
  const filters: WheelFilters = {};

  for (const key of MODEL_FILTERS) {
    const value = firstValue(input, key)?.trim();
    if (value && options[key].includes(value)) filters[key] = value;
  }

  for (const key of VALUE_FILTERS) {
    const value = firstValue(input, key)?.trim();
    if (value && options[key].includes(value)) filters[key] = value;
  }

  const priceOnRequest = firstValue(input, "priceOnRequest")?.trim();
  if (priceOnRequest && options.priceOnRequest.includes(priceOnRequest)) {
    filters.priceOnRequest = priceOnRequest as WheelFilters["priceOnRequest"];
  }

  return filters;
}

function variantMatches(variant: CmsWheelVariant, filters: WheelFilters): boolean {
  if (filters.diameter && String(variant.diameter ?? "") !== filters.diameter) return false;
  if (filters.width && String(variant.width ?? "") !== filters.width) return false;
  if (filters.pcd && (variant.pcd ?? "") !== filters.pcd) return false;
  if (filters.offsetET && String(variant.offsetET ?? "") !== filters.offsetET) return false;
  if (filters.centerBore && String(variant.centerBore ?? "") !== filters.centerBore) return false;
  if (filters.color && (variant.color ?? "") !== filters.color) return false;
  if (filters.priceOnRequest === "yes" && !variant.priceOnRequest) return false;
  if (filters.priceOnRequest === "no" && variant.priceOnRequest) return false;
  return true;
}

export function filterWheelModels<T extends CmsWheelModel>(
  models: readonly T[],
  variants: readonly CmsWheelVariant[],
  filters: WheelFilters,
): T[] {
  const modelMatches = models.filter((model) =>
    (!filters.series || model.series?.trim() === filters.series)
    && (!filters.designStyle || model.designStyle?.trim() === filters.designStyle),
  );
  const hasVariantFilters = VALUE_FILTERS.some((key) => Boolean(filters[key]))
    || Boolean(filters.priceOnRequest);
  if (!hasVariantFilters) return modelMatches;

  const matchingModelIds = new Set(
    variants.filter((variant) => variantMatches(variant, filters)).map((variant) => variant.modelId),
  );
  return modelMatches.filter((model) => matchingModelIds.has(model.id));
}

export function formatWheelModelCount(count: number): string {
  const lastTwo = count % 100;
  const last = count % 10;
  if (last === 1 && lastTwo !== 11) return `${count} модель`;
  if ([2, 3, 4].includes(last) && ![12, 13, 14].includes(lastTwo)) return `${count} модели`;
  return `${count} моделей`;
}
