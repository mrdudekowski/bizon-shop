const MEDIA_REFERENCE_FIELDS = new Set(["assetId", "imageAssetId", "mediaId", "media_id", "featuredImageId"]);

export function hasMediaReference(value: unknown, mediaId: string): boolean {
  if (Array.isArray(value)) return value.some((item) => hasMediaReference(item, mediaId));
  if (value == null || typeof value !== "object") return false;

  for (const [key, child] of Object.entries(value)) {
    if (MEDIA_REFERENCE_FIELDS.has(key) && child != null && String(child) === mediaId) return true;
    if (hasMediaReference(child, mediaId)) return true;
  }
  return false;
}
