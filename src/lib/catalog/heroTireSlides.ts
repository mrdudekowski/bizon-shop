import { formatAxleLabels } from "@/lib/catalog/featuredAssortment";
import type { TireCatalogReadModel } from "@/lib/catalog/tireReadModel";

export type HeroModelSlide = {
  id: string;
  name: string;
  href: string;
  imageUrl: string;
  imageAlt: string;
  axleLabel: string;
};

const HERO_TIRE_SLIDE_LIMIT = 3;

export const HERO_TIRE_CUTOUTS = [
  "/images/hero/dsr158.png",
  "/images/hero/dsr177.png",
  "/images/hero/dsr188.png",
] as const;

export const HERO_TIRE_CUTOUT_BY_SLUG: Record<string, string> = {
  dsr158: HERO_TIRE_CUTOUTS[0],
  dsr177: HERO_TIRE_CUTOUTS[1],
  dsr188: HERO_TIRE_CUTOUTS[2],
};

/** First published TBR models. Cutouts come from HERO_TIRE_CUTOUT_BY_SLUG, not catalog photos. */
export function getHeroTireSlides(
  catalog: TireCatalogReadModel,
  cutouts: Record<string, string> = HERO_TIRE_CUTOUT_BY_SLUG,
): HeroModelSlide[] {
  const tbr =
    catalog.directions.find((direction) => direction.slug === "tbr") ??
    catalog.directions[0];

  return (tbr?.models ?? []).slice(0, HERO_TIRE_SLIDE_LIMIT).map((model, index) => ({
    id: String(model.id),
    name: model.name,
    href: model.href,
    imageUrl: cutouts[model.slug] || HERO_TIRE_CUTOUTS[index] || "",
    imageAlt: `${model.name} — грузовая шина`,
    axleLabel: formatAxleLabels(model),
  }));
}
