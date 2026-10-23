import { createRequire } from "node:module";
import path from "node:path";
import type { FullConfig } from "@playwright/test";
import { loadCmsMediaE2EEnvironment, readCmsMediaE2EConfig } from "./environment";

export default async function globalSetup(_playwrightConfig: FullConfig) {
  const config = readCmsMediaE2EConfig(loadCmsMediaE2EEnvironment());
  const backendPackage = path.resolve(process.cwd(), "backend-app", "package.json");
  const backendRequire = createRequire(backendPackage);
  type PgClient = {
    connect(): Promise<void>;
    query<T extends Record<string, unknown>>(sql: string): Promise<{ rows: T[] }>;
    end(): Promise<void>;
  };
  type S3Client = { send(command: unknown): Promise<unknown>; destroy(): void };
  const { Client } = backendRequire("pg") as {
    Client: new (options: { connectionString: string; connectionTimeoutMillis: number }) => PgClient;
  };
  const { S3Client: createS3Client, HeadBucketCommand } = backendRequire("@aws-sdk/client-s3") as {
    S3Client: new (options: Record<string, unknown>) => S3Client;
    HeadBucketCommand: new (options: { Bucket: string }) => unknown;
  };

  const database = new Client({ connectionString: config.databaseUri, connectionTimeoutMillis: 8000 });
  try {
    await database.connect();
    const { rows } = await database.query<{
      database_name: string;
      has_pages: boolean;
      has_media: boolean;
      has_users: boolean;
    }>(`SELECT current_database() AS database_name,
        to_regclass('public.pages') IS NOT NULL AS has_pages,
        to_regclass('public.media') IS NOT NULL AS has_media,
        to_regclass('public.users') IS NOT NULL AS has_users`);
    const target = rows[0];
    if (target?.database_name !== config.databaseName || !target.has_pages || !target.has_media || !target.has_users) {
      throw new Error("CMS media E2E database identity/schema check failed; no application server was started");
    }
  } finally {
    await database.end().catch(() => undefined);
  }

  const s3 = new createS3Client({
    region: "us-east-1",
    endpoint: config.s3Endpoint,
    forcePathStyle: true,
    credentials: { accessKeyId: config.s3AccessKeyId, secretAccessKey: config.s3SecretAccessKey },
  });
  try {
    const health = await fetch(`${config.s3Endpoint}/minio/health/live`, { signal: AbortSignal.timeout(5000) });
    if (!health.ok) throw new Error("Local S3-compatible service is not healthy; no application server was started");
    await s3.send(new HeadBucketCommand({ Bucket: config.s3Bucket }));
  } finally {
    s3.destroy();
  }

  console.log(`CMS media E2E safety gate passed for ${config.databaseName} and local E2E bucket ${config.s3Bucket}.`);
}
