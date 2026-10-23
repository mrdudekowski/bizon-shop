import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

type ProcessEnv = Record<string, string | undefined>;

export type CmsMediaE2EConfig = {
  databaseUri: string;
  databaseName: string;
  cmsUrl: string;
  apiUrl: string;
  publicSiteUrl: string;
  s3Endpoint: string;
  s3PublicUrl: string;
  s3Bucket: string;
  s3AccessKeyId: string;
  s3SecretAccessKey: string;
  adminLogin: string;
  adminPassword: string;
};

const loopbackHosts = new Set(["127.0.0.1", "localhost", "::1"]);
const CMS_URL = "http://127.0.0.1:3002";
const API_URL = "http://127.0.0.1:4001";
const PUBLIC_SITE_URL = "http://127.0.0.1:3101";
const PUBLIC_SITE_ORIGIN_FOR_BUILD = "https://bizon-e2e.local.test";

export function mergeCmsMediaE2EEnvironment(fileValues: unknown, processValues: ProcessEnv): ProcessEnv {
  if (fileValues == null) return { ...processValues };
  if (typeof fileValues !== "object" || Array.isArray(fileValues)) {
    throw new Error(".cms-media-e2e.local must contain a JSON object of test environment variables");
  }
  const values = Object.entries(fileValues);
  if (values.some(([key, value]) => !key.startsWith("CMS_MEDIA_E2E_") || typeof value !== "string")) {
    throw new Error(".cms-media-e2e.local may contain only string CMS_MEDIA_E2E_* variables");
  }
  return { ...Object.fromEntries(values) as ProcessEnv, ...processValues };
}

export function loadCmsMediaE2EEnvironment(root = process.cwd(), processValues: ProcessEnv = process.env): ProcessEnv {
  const filePath = path.join(root, ".cms-media-e2e.local");
  if (!existsSync(filePath)) return mergeCmsMediaE2EEnvironment(null, processValues);
  let fileValues: unknown;
  try {
    fileValues = JSON.parse(readFileSync(filePath, "utf8"));
  } catch {
    throw new Error(".cms-media-e2e.local could not be parsed as JSON");
  }
  return mergeCmsMediaE2EEnvironment(fileValues, processValues);
}

function required(env: ProcessEnv, key: string): string {
  const value = env[key]?.trim();
  if (!value) throw new Error(`${key} is required for the CMS media E2E run`);
  return value;
}

function localHttpUrl(value: string, key: string, allowPath: boolean): URL {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error(`${key} must be a local HTTP URL`);
  }
  if (url.protocol !== "http:" || !loopbackHosts.has(url.hostname) || url.username || url.password || url.search || url.hash) {
    throw new Error(`${key} must use HTTP on a loopback host without credentials, query, or fragment`);
  }
  if (!allowPath && url.pathname !== "/") throw new Error(`${key} must not include a path`);
  return url;
}

export function readCmsMediaE2EConfig(env: ProcessEnv): CmsMediaE2EConfig {
  const databaseUri = required(env, "CMS_MEDIA_E2E_DATABASE_URI");
  let databaseUrl: URL;
  try {
    databaseUrl = new URL(databaseUri);
  } catch {
    throw new Error("CMS_MEDIA_E2E_DATABASE_URI must be a PostgreSQL URL");
  }
  const databaseName = decodeURIComponent(databaseUrl.pathname.replace(/^\//, ""));
  if (!new Set(["postgres:", "postgresql:"]).has(databaseUrl.protocol)
    || !loopbackHosts.has(databaseUrl.hostname)
    || !databaseUrl.username
    || !databaseUrl.password
    || !/(?:^|[-_])e2e(?:$|[-_])/i.test(databaseName)) {
    throw new Error("CMS_MEDIA_E2E_DATABASE_URI must point to a credentialed loopback PostgreSQL database named for E2E use");
  }

  const s3Endpoint = required(env, "CMS_MEDIA_E2E_S3_ENDPOINT");
  const endpointUrl = localHttpUrl(s3Endpoint, "CMS_MEDIA_E2E_S3_ENDPOINT", false);
  const s3Bucket = required(env, "CMS_MEDIA_E2E_S3_BUCKET");
  if (!/^[a-z0-9][a-z0-9.-]{1,61}[a-z0-9]$/.test(s3Bucket) || !/(^|[-.])e2e($|[-.])/i.test(s3Bucket)) {
    throw new Error("CMS_MEDIA_E2E_S3_BUCKET must be a valid, explicitly E2E-named bucket");
  }
  const s3PublicUrl = required(env, "CMS_MEDIA_E2E_S3_PUBLIC_URL");
  const publicUrl = localHttpUrl(s3PublicUrl, "CMS_MEDIA_E2E_S3_PUBLIC_URL", true);
  if (publicUrl.origin !== endpointUrl.origin || publicUrl.pathname.replace(/\/$/, "") !== `/${s3Bucket}`) {
    throw new Error("CMS_MEDIA_E2E_S3_PUBLIC_URL must be the checked local endpoint and E2E bucket path");
  }

  const adminLogin = required(env, "CMS_MEDIA_E2E_ADMIN_LOGIN");
  if (!adminLogin.endsWith("@local.test")) throw new Error("CMS_MEDIA_E2E_ADMIN_LOGIN must use the local.test test account domain");

  return {
    databaseUri,
    databaseName,
    cmsUrl: CMS_URL,
    apiUrl: API_URL,
    publicSiteUrl: PUBLIC_SITE_URL,
    s3Endpoint: endpointUrl.origin,
    s3PublicUrl: publicUrl.href.replace(/\/$/, ""),
    s3Bucket,
    s3AccessKeyId: required(env, "CMS_MEDIA_E2E_S3_ACCESS_KEY_ID"),
    s3SecretAccessKey: required(env, "CMS_MEDIA_E2E_S3_SECRET_ACCESS_KEY"),
    adminLogin,
    adminPassword: required(env, "CMS_MEDIA_E2E_ADMIN_PASSWORD"),
  };
}

function stripInheritedInfrastructure(env: ProcessEnv): ProcessEnv {
  return Object.fromEntries(Object.entries(env).filter(([key]) =>
    !/^(?:DATABASE_URI|S3_|AWS_|TIMEWEB_|PUBLIC_SITE_URL$|CONTENT_API_URL$|CMS_BOOTSTRAP_|CMS_MEDIA_E2E_|PORT$|NODE_ENV$|CMS_ALLOWED_ORIGINS$|CORS_ALLOWED_ORIGINS$|API_RATE_LIMIT_DISABLED$|NEXT_PUBLIC_)/i.test(key),
  ));
}

export function createCmsMediaBackendEnv(parent: ProcessEnv, config: CmsMediaE2EConfig): ProcessEnv {
  return {
    ...stripInheritedInfrastructure(parent),
    NODE_ENV: "development",
    PORT: "4001",
    DATABASE_URI: config.databaseUri,
    CMS_ALLOWED_ORIGINS: config.cmsUrl,
    CORS_ALLOWED_ORIGINS: config.publicSiteUrl,
    S3_BUCKET: config.s3Bucket,
    S3_ACCESS_KEY_ID: config.s3AccessKeyId,
    S3_SECRET_ACCESS_KEY: config.s3SecretAccessKey,
    S3_REGION: "us-east-1",
    S3_ENDPOINT: config.s3Endpoint,
    S3_PUBLIC_URL: config.s3PublicUrl,
    S3_FORCE_PATH_STYLE: "true",
    TIMEWEB_CLOUD_TOKEN: "",
    TIMEWEB_PUBLIC_SITE_APP_ID: "",
    PUBLIC_SITE_URL: "",
    CMS_BOOTSTRAP_ADMIN_LOGIN: "",
    CMS_BOOTSTRAP_ADMIN_PASSWORD: "",
    CMS_BOOTSTRAP_EDITOR_LOGIN: "",
    CMS_BOOTSTRAP_EDITOR_PASSWORD: "",
    API_RATE_LIMIT_DISABLED: "1",
  };
}

export function createCmsMediaFrontendEnv(parent: ProcessEnv, config: CmsMediaE2EConfig): ProcessEnv {
  return {
    ...stripInheritedInfrastructure(parent),
    NODE_ENV: "development",
    NEXT_PUBLIC_ADMIN_API_URL: config.apiUrl,
    NEXT_PUBLIC_SITE_URL: config.publicSiteUrl,
  };
}

export function createCmsMediaPublicBuildEnv(parent: ProcessEnv, config: CmsMediaE2EConfig): ProcessEnv {
  return {
    ...stripInheritedInfrastructure(parent),
    NODE_ENV: "production",
    CONTENT_API_URL: config.apiUrl,
    NEXT_PUBLIC_API_URL: config.apiUrl,
    NEXT_PUBLIC_SITE_URL: PUBLIC_SITE_ORIGIN_FOR_BUILD,
    S3_BUCKET: config.s3Bucket,
    S3_ACCESS_KEY_ID: config.s3AccessKeyId,
    S3_SECRET_ACCESS_KEY: config.s3SecretAccessKey,
    S3_REGION: "us-east-1",
    S3_ENDPOINT: config.s3Endpoint,
    S3_PUBLIC_URL: config.s3PublicUrl,
    S3_FORCE_PATH_STYLE: "true",
    PUBLIC_SITE_URL: "",
    TIMEWEB_CLOUD_TOKEN: "",
    TIMEWEB_PUBLIC_SITE_APP_ID: "",
  };
}
