import { TIRE_PERFORMANCE_FEATURE_OPTIONS } from "@/lib/catalog/catalogFieldConstants";

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

export function getFeatureIcon(key: string): FeatureImage | null {
  const image = getFeatureImage(key);
  if (!image) return null;
  return { ...image, src: `/images/catalog/feature-icons/${key}.png` };
}

export type AdvantageIcon = {
  key: string;
  src: string;
  label: string;
};

export function resolveAdvantageIcons(
  advantages: readonly { key: string; title?: string }[],
): AdvantageIcon[] {
  return advantages.flatMap((advantage) => {
    const key = resolveFeatureKey(advantage);
    if (!key) return [];
    const icon = getFeatureIcon(key);
    if (!icon) return [];
    const title = advantage.title?.trim();
    return [
      {
        key,
        src: icon.src,
        label: title || icon.label,
      },
    ];
  });
}

function resolveFeatureKey(advantage: { key: string; title?: string }): string | null {
  if (getFeatureImage(advantage.key)) return advantage.key;
  const title = advantage.title?.trim().toLowerCase();
  if (!title) return null;
  const option = TIRE_PERFORMANCE_FEATURE_OPTIONS.find((entry) => entry.label.toLowerCase() === title);
  return option?.value ?? null;
}
