export type PublicS3Env = {
  bucket: string;
  region: string;
  endpoint?: string;
  publicUrl?: string;
  forcePathStyle: boolean;
};

export function readS3Env(): PublicS3Env {
  return {
    bucket: process.env.S3_BUCKET?.trim() ?? "",
    region: process.env.S3_REGION?.trim() || "us-east-1",
    endpoint: process.env.S3_ENDPOINT?.trim(),
    publicUrl: process.env.S3_PUBLIC_URL?.trim(),
    forcePathStyle: process.env.S3_FORCE_PATH_STYLE === "true",
  };
}

/** Public CDN base for read-only asset URLs (main-app stage 1). */
export function isS3PublicUrlConfigured(): boolean {
  return Boolean(readS3Env().publicUrl);
}
