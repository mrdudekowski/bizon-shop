/** Single source for catalog image fallbacks until Payload media is populated. */
export const CATALOG_IMAGE_PLACEHOLDER = "/images/placeholder.svg";

export function resolveCatalogImageSrc(src?: string | null): string {
  return src?.trim() || CATALOG_IMAGE_PLACEHOLDER;
}

export function hasCatalogImage(src?: string | null): src is string {
  return Boolean(src?.trim());
}
