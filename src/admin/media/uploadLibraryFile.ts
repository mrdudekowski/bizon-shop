import { AdminClientError } from "@/admin/client/errors";
import { browserAdminClient } from "@/admin/client/localStore";

import { mediaMimeFromFile } from "./mediaMime";

export const IMAGE_UPLOAD_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

export function acceptAttribute(types: readonly string[]): string {
  const extensions: string[] = [];
  const mimes: string[] = [];
  if (types.includes("image/jpeg")) {
    extensions.push(".jpg", ".jpeg");
    mimes.push("image/jpeg");
  }
  if (types.includes("image/png")) {
    extensions.push(".png");
    mimes.push("image/png");
  }
  if (types.includes("image/webp")) {
    extensions.push(".webp");
    mimes.push("image/webp");
  }
  if (types.includes("application/pdf")) {
    extensions.push(".pdf");
    mimes.push("application/pdf");
  }
  for (const type of types) {
    if (!mimes.includes(type)) mimes.push(type);
  }
  return [...extensions, ...mimes].join(",");
}

export function firstAllowedFile(files: FileList | undefined, allowed: readonly string[]): File | undefined {
  if (!files) return;
  for (const file of Array.from(files)) {
    if (allowed.includes(mediaMimeFromFile(file))) return file;
  }
}

/** The only creator of a new library file. `allowed` is that caller's type filter. */
export async function uploadLibraryFile(file: File, allowed: readonly string[]): Promise<{ id: string }> {
  const mimeType = mediaMimeFromFile(file);
  if (!allowed.includes(mimeType)) throw new AdminClientError("publish_blocked");
  return browserAdminClient().createAsset({ name: file.name, mimeType, body: file });
}
