import path from "node:path";
import { fileURLToPath } from "node:url";
import type { CollectionConfig } from "payload";

import {
  catalogDeleteAccess,
  mediaReadAccess,
  mediaWriteAccess,
} from "@/access/content";
import {
  ADMIN_GROUPS,
  MEDIA_TYPES,
  publishedAtField,
  seoFields,
  statusField,
} from "@/collections/fields";
import {
  sanitizeMediaFilename,
  setMediaStoragePrefix,
  validateMediaUpload,
} from "@/payload/hooks/mediaStorage";
import { setPublishedAt } from "@/payload/hooks/setPublishedAt";
import {
  revalidateSiteCache,
  revalidateSiteCacheAfterDelete,
} from "@/payload/hooks/revalidateSiteCache";
import {
  ALLOWED_MEDIA_MIME_TYPES,
  isS3StorageEnabled,
  MAX_MEDIA_FILE_SIZE_BYTES,
} from "@/lib/payload/s3StorageConfig";

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

const localMediaDir = path.resolve(dirname, "../../public/media");
const maxFileSizeMb = Math.round(MAX_MEDIA_FILE_SIZE_BYTES / (1024 * 1024));

export const Media: CollectionConfig = {
  slug: "media",
  labels: {
    singular: "Медиафайл",
    plural: "Медиа",
  },
  admin: {
    group: ADMIN_GROUPS.media,
    useAsTitle: "title",
    defaultColumns: ["title", "mediaType", "status", "updatedAt"],
    description: `Max file size: ${maxFileSizeMb} MB. Allowed: JPEG, PNG, WebP, MP4, PDF.`,
  },
  access: {
    read: mediaReadAccess,
    create: mediaWriteAccess,
    update: mediaWriteAccess,
    delete: catalogDeleteAccess,
  },
  hooks: {
    beforeChange: [setMediaStoragePrefix, sanitizeMediaFilename, validateMediaUpload, setPublishedAt],
    afterChange: [revalidateSiteCache],
    afterDelete: [revalidateSiteCacheAfterDelete],
  },
  upload: {
    ...(isS3StorageEnabled() ? {} : { staticDir: localMediaDir }),
    adminThumbnail: "thumbnail",
    mimeTypes: [...ALLOWED_MEDIA_MIME_TYPES],
    filesRequiredOnCreate: true,
    allowRestrictedFileTypes: false,
    focalPoint: true,
    imageSizes: [
      { name: "thumbnail", width: 300 },
      { name: "card", width: 600 },
      { name: "hero", width: 1400 },
      { name: "og", width: 1200, height: 630, crop: "center" },
    ],
  },
  fields: [
    {
      name: "title",
      type: "text",
      label: "Название",
      required: true,
    },
    {
      name: "alt",
      type: "text",
      label: "Alt-текст",
      required: true,
    },
    {
      name: "mediaType",
      type: "select",
      label: "Тип медиа",
      required: true,
      defaultValue: "image",
      options: [...MEDIA_TYPES],
    },
    {
      name: "relatedProduct",
      type: "relationship",
      relationTo: ["products", "tire-models", "wheel-models"],
      label: "Связанный товар / модель",
      admin: {
        description:
          "Товар магазина, модель шины или модель диска. Используется для пути в S3: bizon/{shop|tires|wheels}/{slug}/…",
        components: {
          Field: "./payload-admin/RelatedCatalogField.tsx#RelatedCatalogField",
        },
      },
    },
    {
      name: "sortOrder",
      type: "number",
      label: "Порядок сортировки",
      defaultValue: 0,
      admin: { position: "sidebar" },
    },
    statusField(),
    publishedAtField(),
    seoFields,
  ],
};
