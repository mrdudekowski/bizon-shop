import { readS3Env } from "./env";

/**
 * Build a public object URL from bucket/key layout (Timeweb path-style or virtual-host).
 * Prefer S3_PUBLIC_URL when set (CDN custom domain).
 */
export function buildPublicObjectUrl(key: string, prefix = ""): string | null {
  const env = readS3Env();
  const normalizedKey = [prefix, key].filter(Boolean).join("/").replace(/^\/+/, "");
  if (!normalizedKey) return null;

  if (env.publicUrl) {
    return `${env.publicUrl.replace(/\/$/, "")}/${encodeURI(normalizedKey)}`;
  }

  if (!env.bucket) return null;

  if (env.endpoint) {
    const base = env.endpoint.replace(/\/$/, "");
    if (env.forcePathStyle) {
      return `${base}/${encodeURIComponent(env.bucket)}/${encodeURI(normalizedKey)}`;
    }
    return `${base}/${encodeURI(normalizedKey)}`;
  }

  return `https://${env.bucket}.s3.${env.region}.amazonaws.com/${encodeURI(normalizedKey)}`;
}
