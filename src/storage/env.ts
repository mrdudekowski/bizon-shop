export type S3Env = {
  bucket: string;
  region: string;
  endpoint?: string;
  publicUrl?: string;
  forcePathStyle: boolean;
  isPrivate: boolean;
};

export function readS3Env(): S3Env {
  return {
    bucket: process.env.S3_BUCKET?.trim() ?? "",
    region: process.env.S3_REGION?.trim() || "us-east-1",
    endpoint: process.env.S3_ENDPOINT?.trim(),
    publicUrl: process.env.S3_PUBLIC_URL?.trim(),
    forcePathStyle: process.env.S3_FORCE_PATH_STYLE === "true",
    isPrivate: process.env.S3_ACL === "private" || process.env.S3_PRIVATE === "true",
  };
}

export function isS3Configured(): boolean {
  const { bucket } = readS3Env();
  const accessKey = process.env.S3_ACCESS_KEY_ID?.trim();
  const secret = process.env.S3_SECRET_ACCESS_KEY?.trim();
  return Boolean(bucket && accessKey && secret);
}

export function isS3PublicUrlConfigured(): boolean {
  return Boolean(readS3Env().publicUrl);
}
