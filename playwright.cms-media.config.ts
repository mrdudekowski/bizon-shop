import { defineConfig } from "@playwright/test";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  createCmsMediaFrontendEnv,
  loadCmsMediaE2EEnvironment,
  readCmsMediaE2EConfig,
} from "./scripts/e2e/cms-media/environment";

const root = path.dirname(fileURLToPath(import.meta.url));
const e2eEnvironment = loadCmsMediaE2EEnvironment(root);
const config = readCmsMediaE2EConfig(e2eEnvironment);
const frontendRoot = path.resolve(root, e2eEnvironment.CMS_MEDIA_E2E_FRONTEND_ROOT || "frontend-cms");
const node = process.execPath;

export default defineConfig({
  testDir: "./e2e/cms-media",
  testMatch: "**/*.spec.ts",
  fullyParallel: false,
  workers: 1,
  timeout: 300_000,
  expect: { timeout: 15_000 },
  retries: 0,
  reporter: "list",
  globalSetup: "./scripts/e2e/cms-media/globalSetup.ts",
  use: {
    baseURL: config.cmsUrl,
    channel: process.env.CMS_MEDIA_E2E_BROWSER || (process.platform === "win32" ? "msedge" : undefined),
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  webServer: [
    {
      command: `"${node}" scripts/e2e/cms-media/startBackend.mjs`,
      cwd: root,
      url: `${config.apiUrl}/ready`,
      timeout: 60_000,
      reuseExistingServer: false,
    },
    {
      command: `npm run dev -- --hostname 127.0.0.1 --port ${new URL(config.cmsUrl).port || "80"}`,
      cwd: frontendRoot,
      url: `${config.cmsUrl}/pages/`,
      timeout: 120_000,
      reuseExistingServer: false,
      env: createCmsMediaFrontendEnv(e2eEnvironment, config),
    },
  ],
});
