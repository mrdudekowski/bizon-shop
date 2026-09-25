import type { CollectionBeforeChangeHook } from "payload";
import { APIError } from "payload";

import { MEDIA_TYPES } from "@/collections/fields/constants";
import { getCatalogStorageSegment } from "@/lib/catalog/catalogNav";
import { parseCatalogRelation } from "@/lib/catalog/parseCatalogRelation";
import { isS3StorageEnabled, MAX_MEDIA_FILE_SIZE_BYTES } from "@/lib/payload/s3StorageConfig";

const MEDIA_TYPE_FOLDER: Record<(typeof MEDIA_TYPES)[number]["value"], string> = {
  image: "images",
  video: "videos",
  pdf: "documents",
  certificate: "certificates",
  drawing: "drawings",
  instruction: "instructions",
  render: "renders",
  size_table: "size-tables",
};

async function resolveRelatedCatalogSlug(
  relatedProduct: unknown,
  req: Parameters<CollectionBeforeChangeHook>[0]["req"],
): Promise<{ segment: string; slug: string } | null> {
  const parsed = parseCatalogRelation(relatedProduct);
  if (!parsed) return null;

  const segment = getCatalogStorageSegment(parsed.relationTo);
  if (!segment) return null;

  if (parsed.slug) {
    return { segment, slug: parsed.slug };
  }

  try {
    const doc = await req.payload.findByID({
      collection: parsed.relationTo,
      id: parsed.id,
      depth: 0,
    });

    return typeof doc.slug === "string" ? { segment, slug: doc.slug } : null;
  } catch {
    return null;
  }
}

export const setMediaStoragePrefix: CollectionBeforeChangeHook = async ({ data, req }) => {
  if (!data || !isS3StorageEnabled()) return data;

  const mediaType = (data.mediaType as keyof typeof MEDIA_TYPE_FOLDER) || "image";
  const folder = MEDIA_TYPE_FOLDER[mediaType] ?? "files";
  const relatedCatalog = await resolveRelatedCatalogSlug(data.relatedProduct, req);

  data.prefix = relatedCatalog
    ? `bizon/${relatedCatalog.segment}/${relatedCatalog.slug}/${folder}`
    : `bizon/content/${folder}`;

  return data;
};

export const validateMediaUpload: CollectionBeforeChangeHook = ({ data }) => {
  if (!data?.filesize) return data;

  if (data.filesize > MAX_MEDIA_FILE_SIZE_BYTES) {
    throw new APIError(
      `File exceeds maximum size of ${Math.round(MAX_MEDIA_FILE_SIZE_BYTES / (1024 * 1024))} MB`,
      400,
    );
  }

  return data;
};

export const sanitizeMediaFilename: CollectionBeforeChangeHook = ({ data }) => {
  if (!data?.filename || typeof data.filename !== "string") return data;

  const parts = data.filename.split(".");
  const extension = parts.length > 1 ? parts.pop() : "";
  const baseName = parts
    .join(".")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);

  const safeBase = baseName || "file";
  data.filename = extension ? `${safeBase}.${extension.toLowerCase()}` : safeBase;

  return data;
};
