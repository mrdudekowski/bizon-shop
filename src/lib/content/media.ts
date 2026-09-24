import { resolveAssetUrl, type ResolvedAsset } from "@/lib/media/resolveUrl";

export type ResolvedMedia = ResolvedAsset & {
  title?: string | null;
  mimeType?: string | null;
};

export type MediaSizeName = "thumbnail" | "card" | "hero" | "og";

export function resolveMediaUrl(
  src: string | null | undefined,
  _size?: MediaSizeName,
): string | null {
  return resolveAssetUrl(src)?.url ?? null;
}

export function resolveMedia(
  src: string | null | undefined,
  size?: MediaSizeName,
  alt?: string,
): ResolvedMedia | null {
  const resolved = resolveAssetUrl(src, { alt });
  if (!resolved) return null;
  void size;
  return resolved;
}
