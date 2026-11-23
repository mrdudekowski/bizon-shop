import { describe, expect, it } from "vitest";
import { createCmsMediaBackendEnv, createCmsMediaFrontendEnv, createCmsMediaPublicBuildEnv, mergeCmsMediaE2EEnvironment, readCmsMediaE2EConfig } from "../../scripts/e2e/cms-media/environment";

const validEnvironment = {
  CMS_MEDIA_E2E_DATABASE_URI: "postgres://bizon_local:local-only@127.0.0.1:55434/default_db_e2e",
  CMS_MEDIA_E2E_S3_ENDPOINT: "http://127.0.0.1:59000",
  CMS_MEDIA_E2E_S3_PUBLIC_URL: "http://127.0.0.1:59000/bizon-cms-e2e",
  CMS_MEDIA_E2E_S3_BUCKET: "bizon-cms-e2e",
  CMS_MEDIA_E2E_S3_ACCESS_KEY_ID: "local-access",
  CMS_MEDIA_E2E_S3_SECRET_ACCESS_KEY: "local-secret",
  CMS_MEDIA_E2E_ADMIN_LOGIN: "bizon-local-e2e@local.test",
  CMS_MEDIA_E2E_ADMIN_PASSWORD: "local-e2e-only-password",
};

describe("CMS media E2E environment safety", () => {
  it("loads only scoped test variables and gives process overrides precedence", () => {
    const merged = mergeCmsMediaE2EEnvironment(
      { ...validEnvironment, CMS_MEDIA_E2E_ADMIN_PASSWORD: "file-password" },
      { CMS_MEDIA_E2E_ADMIN_PASSWORD: "process-password", DATABASE_URI: "not-forwarded" },
    );
    expect(merged.CMS_MEDIA_E2E_ADMIN_PASSWORD).toBe("process-password");
    expect(merged.DATABASE_URI).toBe("not-forwarded");
  });

  it("rejects unrelated or non-string values in the ignored local E2E config", () => {
    expect(() => mergeCmsMediaE2EEnvironment({ DATABASE_URI: "postgres://prod" }, {})).toThrow();
    expect(() => mergeCmsMediaE2EEnvironment({ CMS_MEDIA_E2E_ADMIN_PASSWORD: 123 }, {})).toThrow();
  });

  it("accepts an explicitly local PostgreSQL E2E database and local S3 bucket", () => {
    expect(readCmsMediaE2EConfig(validEnvironment)).toMatchObject({
      databaseName: "default_db_e2e",
      cmsUrl: "http://127.0.0.1:3002",
      apiUrl: "http://127.0.0.1:4001",
      publicSiteUrl: "http://127.0.0.1:3101",
      s3Bucket: "bizon-cms-e2e",
    });
  });

  it("uses the selected loopback port for both Playwright and the backend", () => {
    const config = readCmsMediaE2EConfig({ ...validEnvironment, CMS_MEDIA_E2E_API_PORT: "49152" });
    expect(config.apiUrl).toBe("http://127.0.0.1:49152");
    expect(createCmsMediaBackendEnv({}, config).PORT).toBe("49152");
  });

  it("uses the chosen CMS port for browser navigation and authenticated API origins", () => {
    const config = readCmsMediaE2EConfig({ ...validEnvironment, CMS_MEDIA_E2E_CMS_PORT: "3302" });
    expect(config.cmsUrl).toBe("http://127.0.0.1:3302");
    expect(createCmsMediaBackendEnv({}, config).CMS_ALLOWED_ORIGINS).toBe(config.cmsUrl);
    expect(createCmsMediaFrontendEnv({}, config).NEXT_PUBLIC_ADMIN_API_URL).toBe(config.apiUrl);
  });

  it.each([
    ["out-of-range CMS port", { CMS_MEDIA_E2E_CMS_PORT: "65536" }],
    ["non-numeric CMS port", { CMS_MEDIA_E2E_CMS_PORT: "3302/path" }],
    ["invalid API port", { CMS_MEDIA_E2E_API_PORT: "99999" }],
    ["non-numeric API port", { CMS_MEDIA_E2E_API_PORT: "4001/path" }],
    ["remote database host", { CMS_MEDIA_E2E_DATABASE_URI: "postgres://user:pass@db.example.com/default_db_e2e" }],
    ["production database name", { CMS_MEDIA_E2E_DATABASE_URI: "postgres://user:pass@127.0.0.1:55434/default_db" }],
    ["remote S3 endpoint", { CMS_MEDIA_E2E_S3_ENDPOINT: "https://s3.twcstorage.ru" }],
    ["production S3 bucket", { CMS_MEDIA_E2E_S3_BUCKET: "bizon-production" }],
    ["production administrator login", { CMS_MEDIA_E2E_ADMIN_LOGIN: "admin" }],
  ])("rejects %s before starting services", (_case, override) => {
    expect(() => readCmsMediaE2EConfig({ ...validEnvironment, ...override })).toThrow();
  });

  it("starts backend with the checked local targets and strips production deploy/storage credentials", () => {
    const config = readCmsMediaE2EConfig(validEnvironment);
    const childEnv = createCmsMediaBackendEnv({
      ...validEnvironment,
      DATABASE_URI: "postgres://production.invalid/default_db",
      S3_BUCKET: "production-bucket",
      S3_SECRET_ACCESS_KEY: "production-secret",
      TIMEWEB_CLOUD_TOKEN: "production-token",
      TIMEWEB_PUBLIC_SITE_APP_ID: "production-app",
      PUBLIC_SITE_URL: "https://production.example.com",
      CONTENT_API_URL: "https://production.example.com/api",
      AWS_ACCESS_KEY_ID: "production-access",
    }, config);

    expect(childEnv).toMatchObject({
      DATABASE_URI: validEnvironment.CMS_MEDIA_E2E_DATABASE_URI,
      S3_ENDPOINT: validEnvironment.CMS_MEDIA_E2E_S3_ENDPOINT,
      S3_PUBLIC_URL: validEnvironment.CMS_MEDIA_E2E_S3_PUBLIC_URL,
      S3_BUCKET: validEnvironment.CMS_MEDIA_E2E_S3_BUCKET,
      TIMEWEB_CLOUD_TOKEN: "",
      TIMEWEB_PUBLIC_SITE_APP_ID: "",
      PUBLIC_SITE_URL: "",
      PORT: "4001",
      NODE_ENV: "development",
    });
    expect(childEnv.S3_SECRET_ACCESS_KEY).toBe(validEnvironment.CMS_MEDIA_E2E_S3_SECRET_ACCESS_KEY);
    expect(childEnv.AWS_ACCESS_KEY_ID).toBeUndefined();
    expect(childEnv.CONTENT_API_URL).toBeUndefined();
    expect(childEnv.CMS_MEDIA_E2E_ADMIN_PASSWORD).toBeUndefined();
  });

  it("routes the CMS process to the local API without inheriting database or storage config", () => {
    const config = readCmsMediaE2EConfig(validEnvironment);
    const childEnv = createCmsMediaFrontendEnv({
      ...validEnvironment,
      DATABASE_URI: "postgres://production.invalid/default_db",
      S3_ENDPOINT: "https://s3.twcstorage.ru",
      NEXT_PUBLIC_ADMIN_API_URL: "https://production.example.com",
    }, config);

    expect(childEnv).toMatchObject({
      NODE_ENV: "development",
      NEXT_PUBLIC_ADMIN_API_URL: "http://127.0.0.1:4001",
      NEXT_PUBLIC_SITE_URL: "http://127.0.0.1:3101",
    });
    expect(childEnv.DATABASE_URI).toBeUndefined();
    expect(childEnv.S3_ENDPOINT).toBeUndefined();
    expect(childEnv.CMS_MEDIA_E2E_ADMIN_PASSWORD).toBeUndefined();
  });

  it("keeps public-site build origin syntactically valid without exposing production URLs", () => {
    const config = readCmsMediaE2EConfig(validEnvironment);
    const childEnv = createCmsMediaPublicBuildEnv({
      NEXT_PUBLIC_SITE_URL: "https://production.example.com",
      DATABASE_URI: "postgres://production.invalid/default_db",
    }, config);

    expect(childEnv.NEXT_PUBLIC_SITE_URL).toBe("https://bizon-e2e.local.test");
    expect(childEnv.CONTENT_API_URL).toBe("http://127.0.0.1:4001");
    expect(childEnv.DATABASE_URI).toBeUndefined();
  });
});
