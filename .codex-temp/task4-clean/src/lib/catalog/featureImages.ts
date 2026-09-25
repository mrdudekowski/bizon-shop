import { TIRE_PERFORMANCE_FEATURE_OPTIONS } from "@/collections/fields/tireCatalogFields";

export type TireFeatureKey = (typeof TIRE_PERFORMANCE_FEATURE_OPTIONS)[number]["value"];

export type FeatureImage = {
  src: string;
  alt: string;
  label: string;
};

export const FEATURE_IMAGE_KEYS: readonly TireFeatureKey[] = Object.freeze(
  TIRE_PERFORMANCE_FEATURE_OPTIONS.map((option) => option.value),
);

const byKey = Object.fromEntries(
  TIRE_PERFORMANCE_FEATURE_OPTIONS.map((option) => [
    option.value,
    {
      src: `/images/catalog/features/${option.value}.png`,
      alt: option.label,
      label: option.label,
    } satisfies FeatureImage,
  ]),
) as Record<TireFeatureKey, FeatureImage>;

export function getFeatureImage(key: string): FeatureImage | null {
  if (Object.hasOwn(byKey, key)) return byKey[key as TireFeatureKey];
  return null;
}
