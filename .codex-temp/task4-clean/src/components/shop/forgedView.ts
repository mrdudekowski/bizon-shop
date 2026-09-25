import type { CmsWheelModel } from "@/lib/cms/types";

export type ForgedWheelView = {
  id: string;
  slug: string;
  name: string;
  positioning: string;
  finish: string;
  description: string;
  heroImage: string;
  gallery: { src: string; alt: string; label: string }[];
};

export function toForgedWheelView(model: CmsWheelModel): ForgedWheelView | null {
  const heroImage = model.imageUrl?.trim();
  if (!heroImage) return null;

  return {
    id: model.id,
    slug: model.slug,
    name: model.name,
    positioning: model.designStyle?.trim() || "Forged",
    finish: model.series?.trim() || "",
    description: model.descriptionShort,
    heroImage,
    gallery: model.gallery.map((image) => ({
      src: image.url,
      alt: image.alt,
      label: image.label,
    })),
  };
}

export function metaLine(view: ForgedWheelView): string {
  return [view.positioning, view.finish].filter(Boolean).join(" · ");
}
