import type { TireCatalogReadModel } from "@/lib/catalog/tireReadModel";

export type HeroModelSlide = {
  id: string;
  name: string;
  href: string;
  imageUrl: string;
  imageAlt: string;
};

/** First published TBR models with images (fallback: first direction with media). */
export function getHeroTireSlides(catalog: TireCatalogReadModel): HeroModelSlide[] {
  const tbr =
    catalog.directions.find((direction) => direction.slug === "tbr") ??
    catalog.directions[0];

  return (tbr?.models ?? [])
    .map((model) => {
      const imageUrl = model.imageUrl || model.gallery?.[0];
      if (!imageUrl) return null;
      return {
        id: String(model.id),
        name: model.name,
        href: model.href,
        imageUrl,
        imageAlt: `${model.name} — грузовая шина`,
      } satisfies HeroModelSlide;
    })
    .filter((slide): slide is HeroModelSlide => slide != null)
    .slice(0, 3);
}
