import { s3Storage } from "@payloadcms/storage-s3";
import type { Config, Plugin } from "payload";

export const ALLOWED_MEDIA_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "video/mp4",
  "application/pdf",
] as const;

/** 50 MB — covers PDFs and short product videos */
export const MAX_MEDIA_FILE_SIZE_BYTES = 50 * 1024 * 1024;

export function isS3StorageEnabled(): boolean {
  return Boolean(
    process.env.S3_BUCKET?.trim() &&
      process.env.S3_ACCESS_KEY_ID?.trim() &&
      process.env.S3_SECRET_ACCESS_KEY?.trim(),
  );
}

function buildPublicFileUrl(filename: string, prefix = ""): string | undefined {
  const publicBase = process.env.S3_PUBLIC_URL?.trim();
  if (!publicBase) return undefined;

  const key = [prefix, filename].filter(Boolean).join("/");
  return `${publicBase.replace(/\/$/, "")}/${encodeURI(key)}`;
}

function isPrivateS3Bucket(): boolean {
  return process.env.S3_ACL === "private" || process.env.S3_PRIVATE === "true";
}

/** Local shim avoids Next.js RSC manifest errors with @payloadcms/storage-s3 on Windows. */
export const S3_CLIENT_UPLOAD_HANDLER =
  "./payload-admin/S3ClientUploadHandler.tsx#S3ClientUploadHandler";

const PACKAGE_S3_CLIENT_HANDLER = "@payloadcms/storage-s3/client#S3ClientUploadHandler";

function patchS3AdminClientHandler(config: Config): Config {
  const legacyDependency = config.admin?.dependencies?.[PACKAGE_S3_CLIENT_HANDLER];
  if (!legacyDependency) return config;

  config.admin!.dependencies![S3_CLIENT_UPLOAD_HANDLER] = {
    ...legacyDependency,
    path: S3_CLIENT_UPLOAD_HANDLER,
  };
  delete config.admin!.dependencies![PACKAGE_S3_CLIENT_HANDLER];

  if (config.admin?.components?.providers?.length) {
    config.admin.components.providers = config.admin.components.providers.map((provider) => {
      if (
        typeof provider === "object" &&
        provider !== null &&
        "path" in provider &&
        provider.path === PACKAGE_S3_CLIENT_HANDLER
      ) {
        return { ...provider, path: S3_CLIENT_UPLOAD_HANDLER };
      }
      return provider;
    });
  }

  return config;
}

export function getS3StoragePlugin(): Plugin {
  const bucket = process.env.S3_BUCKET?.trim() ?? "";
  const region = process.env.S3_REGION?.trim() || "us-east-1";
  const endpoint = process.env.S3_ENDPOINT?.trim();
  const forcePathStyle = process.env.S3_FORCE_PATH_STYLE === "true";
  const isPrivate = isPrivateS3Bucket();
  const acl = isPrivate ? "private" : "public-read";

  const mediaCollectionConfig: {
    prefix: string;
    generateFileURL?: (args: { filename: string; prefix?: string }) => string;
  } = {
    prefix: "bizon/media",
  };

  // Private bucket: do NOT expose direct S3 URLs — Payload proxies via /api/media/file/...
  if (!isPrivate) {
    mediaCollectionConfig.generateFileURL = ({ filename, prefix = "" }) =>
      buildPublicFileUrl(filename, prefix) ??
      (endpoint
        ? `${endpoint.replace(/\/$/, "")}/${bucket}/${[prefix, filename].filter(Boolean).join("/")}`
        : `https://${bucket}.s3.${region}.amazonaws.com/${[prefix, filename].filter(Boolean).map(encodeURIComponent).join("/")}`);
  }

  const s3Plugin = s3Storage({
    enabled: isS3StorageEnabled(),
    alwaysInsertFields: true,
    acl,
    bucket,
    collections: {
      media: mediaCollectionConfig,
    },
    config: {
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY_ID?.trim() ?? "",
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY?.trim() ?? "",
      },
      region,
      ...(endpoint ? { endpoint, forcePathStyle } : {}),
    },
  });

  return (incomingConfig) => {
    const result = s3Plugin(incomingConfig);
    if (result instanceof Promise) {
      return result.then(patchS3AdminClientHandler);
    }
    return patchS3AdminClientHandler(result);
  };
}
