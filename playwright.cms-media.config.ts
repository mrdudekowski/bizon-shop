import { defineConfig } from "@playwright/test";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  createCmsMediaBackendEnv,
  createCmsMediaFrontendEnv,
  loadCmsMediaE2EEnvironment,
  readCmsMediaE2EConfig,
} from "./scripts/e2e/cms-media/environment";

const root = path.dirname(fileURLToPath(import.meta.url));
const e2eEnvironment = loadCmsMediaE2EEnvironment(root);
const config = readCmsMediaE2EConfig(e2eEnvironment);
const backendTsx = path.join(root, "backend-app", "node_modules", "tsx", "dist", "cli.mjs");
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
      command: `"${node}" "${backendTsx}" src/server.ts`,
      cwd: path.join(root, "backend-app"),
      url: `${config.apiUrl}/ready`,
      timeout: 60_000,
      reuseExistingServer: false,
      env: createCmsMediaBackendEnv(e2eEnvironment, config),
    },
    {
      command: "npm run dev -- --hostname 127.0.0.1 --port 3002",
      cwd: path.join(root, "frontend-cms"),
      url: `${config.cmsUrl}/pages/`,
      timeout: 120_000,
      reuseExistingServer: false,
      env: createCmsMediaFrontendEnv(e2eEnvironment, config),
    },
  ],
});
