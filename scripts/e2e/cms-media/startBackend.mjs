import { spawnSync } from "node:child_process";
import path from "node:path";
import { checkInfrastructure } from "./globalSetup.ts";
import { createCmsMediaBackendEnv, loadCmsMediaE2EEnvironment, readCmsMediaE2EConfig } from "./environment.ts";

// Playwright starts webServer plugins before globalSetup, including in IDE runs.
const env = loadCmsMediaE2EEnvironment();
const config = readCmsMediaE2EConfig(env);
const backendRoot = path.resolve(env.CMS_MEDIA_E2E_BACKEND_ROOT || "backend-app");
await checkInfrastructure(env);
const backend = spawnSync(process.execPath, ["node_modules/tsx/dist/cli.mjs", "src/server.ts"], {
  cwd: backendRoot,
  env: createCmsMediaBackendEnv(env, config),
  stdio: "inherit",
});
if (backend.error) throw backend.error;
process.exitCode = backend.status ?? 1;
