import { randomUUID } from "node:crypto";
import { buildPublicObjectUrl } from "./publicObjectUrl";
import { isS3Configured, isS3PublicUrlConfigured } from "./env";
import type { ObjectStore } from "./objectStore";

export const MAX_MEDIA_BYTES = 20 * 1024 * 1024;
export const ALLOWED_MEDIA_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "video/mp4",
  "application/pdf",
] as const;

export class MediaRejected extends Error {
  constructor(readonly code: "storage_unavailable" | "publish_blocked") {
    super(code);
  }
}

function extensionFor(mime: string, name: string): string {
  if (mime === "image/jpeg") return ".jpg";
  if (mime === "image/png") return ".png";
  if (mime === "image/webp") return ".webp";
  if (mime === "video/mp4") return ".mp4";
  if (mime === "application/pdf") return ".pdf";
  const match = name.toLowerCase().match(/\.[a-z0-9]+$/);
  return match?.[0] ?? "";
}

export async function putMedia(
  store: ObjectStore,
  file: { name: string; mimeType: string; body: Buffer },
): Promise<{ key: string; url: string; mimeType: string; name: string }> {
  if (!isS3Configured() || !isS3PublicUrlConfigured()) throw new MediaRejected("storage_unavailable");
  if (file.body.length === 0 || file.body.length > MAX_MEDIA_BYTES) throw new MediaRejected("publish_blocked");
  if (!ALLOWED_MEDIA_MIME_TYPES.includes(file.mimeType as (typeof ALLOWED_MEDIA_MIME_TYPES)[number])) {
    throw new MediaRejected("publish_blocked");
  }
  const key = `bizon/media/${randomUUID()}${extensionFor(file.mimeType, file.name)}`;
  await store.put({ key, body: file.body, contentType: file.mimeType });
  const url = buildPublicObjectUrl(key);
  if (!url) throw new MediaRejected("storage_unavailable");
  return { key, url, mimeType: file.mimeType, name: file.name };
}
