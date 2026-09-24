import { buildPublicObjectUrl } from "@/lib/storage/publicObjectUrl";
import { isS3PublicUrlConfigured } from "@/lib/storage/env";

export type ResolvedAsset = {
  url: string;
  alt: string;
};

/** Local static file under /public */
export function toLocalPublicUrl(pathOrFilename: string): string {
  const trimmed = pathOrFilename.trim().replace(/^\/+/, "");
  if (trimmed.startsWith("public/")) {
    return `/${trimmed.slice("public/".length)}`;
  }
  if (trimmed.startsWith("media/")) {
    return `/${trimmed}`;
  }
  return `/media/${trimmed}`;
}

/**
 * Resolve a site asset path: absolute http(s), site-relative, or S3 key via CDN.
 */
export function resolveAssetUrl(
  src: string | null | undefined,
  options?: { prefix?: string; alt?: string },
): ResolvedAsset | null {
  const raw = src?.trim();
  if (!raw) return null;

  if (raw.startsWith("http://") || raw.startsWith("https://") || raw.startsWith("/")) {
    return { url: raw, alt: options?.alt ?? "" };
  }

  if (isS3PublicUrlConfigured()) {
    const remote = buildPublicObjectUrl(raw, options?.prefix ?? "bizon/media");
    if (remote) return { url: remote, alt: options?.alt ?? "" };
  }

  return { url: toLocalPublicUrl(raw), alt: options?.alt ?? "" };
}

export function resolveAssetUrlString(
  src: string | null | undefined,
  options?: { prefix?: string },
): string | null {
  return resolveAssetUrl(src, options)?.url ?? null;
}
