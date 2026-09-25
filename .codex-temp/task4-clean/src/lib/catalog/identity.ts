/** ponytail: SKU formula is deterministic; collisions checked at save via unique index */

export function buildModelCodeFromSlug(slug: string): string {
  const cleaned = slug
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "");
  return cleaned.length > 0 ? cleaned : "MODEL";
}

export function buildTireVariantSku(modelCode: string, sizeNormalized: string): string {
  const code = buildModelCodeFromSlug(modelCode);
  const size = sizeNormalized
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "")
    .replace(/\//g, "-");
  return `${code}-${size}`;
}
