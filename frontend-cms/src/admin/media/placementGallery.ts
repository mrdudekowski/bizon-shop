import type { ImagePlacement } from "@/admin/domain/types";

/** Меняет местами cover и элемент gallery[index]. */
export function swapWithCover(
  cover: ImagePlacement | undefined,
  gallery: ImagePlacement[],
  galleryIndex: number,
): { cover: ImagePlacement | undefined; gallery: ImagePlacement[] } {
  if (galleryIndex < 0 || galleryIndex >= gallery.length) return { cover, gallery };
  const nextCover = gallery[galleryIndex];
  const rest = gallery.filter((_, index) => index !== galleryIndex);
  if (cover != null) rest.unshift(cover);
  return { cover: nextCover, gallery: rest };
}

export function reorderGallery(gallery: ImagePlacement[], fromIndex: number, toIndex: number): ImagePlacement[] {
  if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0 || fromIndex >= gallery.length || toIndex >= gallery.length) {
    return gallery;
  }
  const next = gallery.slice();
  const [item] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, item);
  return next;
}
