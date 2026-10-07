import { DeleteObjectCommand, HeadBucketCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { readS3Env } from "./env";
import type { ObjectStore } from "./objectStore";

let client: S3Client | null = null;

function s3Client(): S3Client {
  if (client) return client;
  const env = readS3Env();
  client = new S3Client({
    region: env.region,
    endpoint: env.endpoint || undefined,
    forcePathStyle: env.forcePathStyle,
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY_ID?.trim() ?? "",
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY?.trim() ?? "",
    },
  });
  return client;
}

export function s3ObjectStore(): ObjectStore {
  return {
    async checkAvailable() {
      const env = readS3Env();
      await s3Client().send(new HeadBucketCommand({ Bucket: env.bucket }));
    },
    async put({ key, body, contentType }) {
      const env = readS3Env();
      await s3Client().send(
        new PutObjectCommand({
          Bucket: env.bucket,
          Key: key,
          Body: body,
          ContentType: contentType,
        }),
      );
    },
    async delete({ key }) {
      const env = readS3Env();
      await s3Client().send(new DeleteObjectCommand({ Bucket: env.bucket, Key: key }));
    },
  };
}
