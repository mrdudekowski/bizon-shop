import { randomUUID } from "node:crypto";

import { isS3Configured, isS3PublicUrlConfigured } from "./storage/env";
import type { ObjectStore } from "./storage/objectStore";
import { buildPublicObjectUrl } from "./storage/publicObjectUrl";

export const MAX_ATTACHMENT_BYTES = 15 * 1024 * 1024;
/** Room for the multipart envelope around a file of exactly `MAX_ATTACHMENT_BYTES`. */
export const MAX_ATTACHMENT_BODY_BYTES = MAX_ATTACHMENT_BYTES + 16 * 1024;

export class AttachmentRejected extends Error {
  constructor(readonly code: "invalid_multipart" | "too_many_files" | "unsupported_type" | "too_large" | "storage_unavailable") {
    super(code);
  }
}

type AttachmentKind = { mime: string; extension: string; declaredAliases: readonly string[] };

const ATTACHMENT_KINDS = {
  pdf: { mime: "application/pdf", extension: ".pdf", declaredAliases: ["application/pdf"] },
  jpeg: { mime: "image/jpeg", extension: ".jpg", declaredAliases: ["image/jpeg", "image/jpg", "image/pjpeg"] },
  png: { mime: "image/png", extension: ".png", declaredAliases: ["image/png", "image/x-png"] },
  webp: { mime: "image/webp", extension: ".webp", declaredAliases: ["image/webp"] },
  zip: {
    mime: "application/zip",
    extension: ".zip",
    declaredAliases: ["application/zip", "application/x-zip-compressed", "application/x-zip"],
  },
} as const satisfies Record<string, AttachmentKind>;

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

/** Same signatures as `putMedia`, plus `PK` for zip. Images are not re-encoded here, so only the header is checked. */
function detectKind(body: Buffer): AttachmentKind | null {
  if (body.length >= PNG_SIGNATURE.length && body.subarray(0, PNG_SIGNATURE.length).equals(PNG_SIGNATURE)) return ATTACHMENT_KINDS.png;
  if (body.length >= 3 && body[0] === 0xff && body[1] === 0xd8 && body[2] === 0xff) return ATTACHMENT_KINDS.jpeg;
  if (body.length >= 12 && body.toString("ascii", 0, 4) === "RIFF" && body.toString("ascii", 8, 12) === "WEBP") {
    return ATTACHMENT_KINDS.webp;
  }
  if (body.length >= 5 && body.toString("ascii", 0, 5) === "%PDF-") return ATTACHMENT_KINDS.pdf;
  if (body.length >= 2 && body[0] === 0x50 && body[1] === 0x4b) return ATTACHMENT_KINDS.zip;
  return null;
}

export type AttachmentFile = { name: string; mimeType: string; body: Buffer };

/** Reads exactly one file part. Plain fields are ignored; a second file part is rejected. */
export function parseSingleFilePart(body: Buffer, contentType: string): AttachmentFile {
  const boundary = /boundary=(?:"([^"]+)"|([^;\s]+))/i.exec(contentType);
  if (!boundary || !/^multipart\/form-data/i.test(contentType)) throw new AttachmentRejected("invalid_multipart");
  const delimiter = Buffer.from(`--${boundary[1] ?? boundary[2]}`);

  const starts: number[] = [];
  for (let at = body.indexOf(delimiter); at !== -1; at = body.indexOf(delimiter, at + delimiter.length)) {
    starts.push(at);
  }

  let file: AttachmentFile | null = null;
  for (let index = 0; index < starts.length - 1; index += 1) {
    const partStart = starts[index] + delimiter.length;
    const part = body.subarray(partStart, starts[index + 1]);
    const headerEnd = part.indexOf("\r\n\r\n");
    if (headerEnd === -1) throw new AttachmentRejected("invalid_multipart");
    const headers = part.subarray(0, headerEnd).toString("utf8");
    const filename = /filename="([^"]*)"/i.exec(headers);
    if (!filename) continue;
    if (file) throw new AttachmentRejected("too_many_files");
    const contentTypeHeader = /^content-type:\s*([^\r\n;]+)/im.exec(headers);
    file = {
      name: filename[1],
      mimeType: contentTypeHeader?.[1].trim().toLowerCase() ?? "",
      body: part.subarray(headerEnd + 4, part.length - 2),
    };
  }
  if (!file) throw new AttachmentRejected("invalid_multipart");
  return file;
}

/** Stores the original bytes (no re-encoding, unlike `putMedia`) and returns the URL we serve them from. */
export async function storeRequestAttachment(store: ObjectStore, file: AttachmentFile): Promise<{ url: string }> {
  if (!isS3Configured() || !isS3PublicUrlConfigured()) throw new AttachmentRejected("storage_unavailable");
  if (file.body.length === 0) throw new AttachmentRejected("invalid_multipart");
  if (file.body.length > MAX_ATTACHMENT_BYTES) throw new AttachmentRejected("too_large");

  const kind = detectKind(file.body);
  const declared = file.mimeType.split(";")[0].trim().toLowerCase();
  const declaredMatches = !declared || declared === "application/octet-stream" || kind?.declaredAliases.some((alias) => alias === declared);
  if (!kind || !declaredMatches) throw new AttachmentRejected("unsupported_type");

  const key = `requests/${randomUUID()}${kind.extension}`;
  const url = buildPublicObjectUrl(key);
  if (!url) throw new AttachmentRejected("storage_unavailable");
  try {
    await store.put({ key, body: file.body, contentType: kind.mime });
  } catch {
    throw new AttachmentRejected("storage_unavailable");
  }
  return { url };
}
