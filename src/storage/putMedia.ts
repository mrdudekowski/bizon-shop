import { createHash, randomUUID } from "node:crypto";
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

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

export class MediaRejected extends Error {
  constructor(
    readonly code: "storage_unavailable" | "database_unavailable" | "database_save_failed" | "publish_blocked",
    options?: ErrorOptions,
  ) {
    super(code, options);
  }
}

export async function assertMediaUploadReady(store: ObjectStore, checkDatabase: () => Promise<unknown>): Promise<void> {
  try {
    await checkDatabase();
  } catch {
    throw new MediaRejected("database_unavailable");
  }
  if (!isS3Configured() || !isS3PublicUrlConfigured()) throw new MediaRejected("storage_unavailable");
  try {
    await store.checkAvailable();
  } catch {
    throw new MediaRejected("storage_unavailable");
  }
}

export class MediaCleanupRequired extends Error {
  constructor(
    readonly key: string,
    readonly originalError: unknown,
    readonly cleanupError: unknown,
    readonly cleanupRecorded: boolean,
  ) {
    super("media_cleanup_pending", { cause: originalError });
  }
}

function looksLikePng(body: Buffer): boolean {
  return body.length >= PNG_SIGNATURE.length && body.subarray(0, PNG_SIGNATURE.length).equals(PNG_SIGNATURE);
}

function looksLikeJpeg(body: Buffer): boolean {
  return body.length >= 3 && body[0] === 0xff && body[1] === 0xd8 && body[2] === 0xff;
}

function looksLikeWebp(body: Buffer): boolean {
  return body.length >= 12 && body.toString("ascii", 0, 4) === "RIFF" && body.toString("ascii", 8, 12) === "WEBP";
}

function looksLikePdf(body: Buffer): boolean {
  return body.length >= 5 && body.toString("ascii", 0, 5) === "%PDF-";
}

function looksLikeMp4(body: Buffer): boolean {
  return body.length >= 8 && body.toString("ascii", 4, 8) === "ftyp";
}

function detectedMime(body: Buffer): string | null {
  if (looksLikePng(body)) return "image/png";
  if (looksLikeJpeg(body)) return "image/jpeg";
  if (looksLikeWebp(body)) return "image/webp";
  if (looksLikePdf(body)) return "application/pdf";
  if (looksLikeMp4(body)) return "video/mp4";
  return null;
}

function normalizeDeclaredMime(mimeType: string): string {
  const declared = mimeType.split(";")[0].trim().toLowerCase();
  if (declared === "image/x-png") return "image/png";
  if (declared === "image/jpg" || declared === "image/pjpeg") return "image/jpeg";
  return declared;
}

export function resolveMediaMime(file: { name: string; mimeType: string; body: Buffer }): string {
  const detected = detectedMime(file.body);
  const declared = normalizeDeclaredMime(file.mimeType);
  if (!detected || !(ALLOWED_MEDIA_MIME_TYPES as readonly string[]).includes(detected)) {
    throw new MediaRejected("publish_blocked");
  }
  if (declared && declared !== "application/octet-stream" && declared !== detected) {
    throw new MediaRejected("publish_blocked");
  }
  return detected;
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
): Promise<{ key: string; url: string; mimeType: string; declaredMimeType: string; name: string; byteSize: number; sha256: string }> {
  if (!isS3Configured() || !isS3PublicUrlConfigured()) throw new MediaRejected("storage_unavailable");
  if (file.body.length === 0 || file.body.length > MAX_MEDIA_BYTES) throw new MediaRejected("publish_blocked");
  const mimeType = resolveMediaMime(file);
  if (!ALLOWED_MEDIA_MIME_TYPES.includes(mimeType as (typeof ALLOWED_MEDIA_MIME_TYPES)[number])) {
    throw new MediaRejected("publish_blocked");
  }
  const key = `bizon/media/${randomUUID()}${extensionFor(mimeType, file.name)}`;
  const url = buildPublicObjectUrl(key);
  if (!url) throw new MediaRejected("storage_unavailable");
  try {
    await store.put({ key, body: file.body, contentType: mimeType });
  } catch {
    throw new MediaRejected("storage_unavailable");
  }
  return {
    key,
    url,
    mimeType,
    declaredMimeType: normalizeDeclaredMime(file.mimeType),
    name: file.name,
    byteSize: file.body.length,
    sha256: createHash("sha256").update(file.body).digest("hex"),
  };
}

export async function uploadAndPersistMedia<T>(
  store: ObjectStore,
  file: { name: string; mimeType: string; body: Buffer },
  persist: (stored: Awaited<ReturnType<typeof putMedia>>) => Promise<T>,
  recordCleanupFailure?: (key: string) => Promise<void>,
): Promise<T> {
  const stored = await putMedia(store, file);
  try {
    return await persist(stored);
  } catch (originalError) {
    try {
      await store.delete({ key: stored.key });
    } catch (cleanupError) {
      let cleanupRecorded = false;
      try {
        if (recordCleanupFailure) {
          await recordCleanupFailure(stored.key);
          cleanupRecorded = true;
        }
      } catch {
        console.error("media.orphan_cleanup_queue_failed", { key: stored.key });
      }
      throw new MediaCleanupRequired(stored.key, originalError, cleanupError, cleanupRecorded);
    }
    throw new MediaRejected("database_save_failed", { cause: originalError });
  }
}
