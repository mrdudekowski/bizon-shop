import { execFile } from "node:child_process";
import { once } from "node:events";
import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import { promisify } from "node:util";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { expect, it } from "vitest";

it("direct Playwright refuses backend startup when the DB identity check fails", async () => {
  const temp = await mkdtemp(path.join(os.tmpdir(), "bizon-preflight-test-"));
  let readinessProbes = 0;
  const readiness = createServer((request, response) => {
    if (request.url === "/ready") readinessProbes++;
    response.writeHead(503).end();
  });
  const fakeModules = path.join(temp, "node_modules");
  async function stub(file: string, source: string) {
    const target = path.join(fakeModules, file);
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, source);
  }
  try {
    await stub("pg/index.js", `exports.Client = class {
      async connect() {}
      async query() { return { rows: [{ database_name: "wrong_database" }] }; }
      async end() {}
    };`);
    await stub("@aws-sdk/client-s3/index.js", "module.exports = {};");
    await stub("tsx/dist/cli.mjs", 'throw new Error("Backend startup marker");');
    // Hold the system-assigned port through child exit. Other local services cannot take it.
    readiness.listen(0, "127.0.0.1");
    await once(readiness, "listening");
    const port = (readiness.address() as AddressInfo).port;
    const file = path.join(temp, "test-environment.json");
    const example = JSON.parse(await readFile("scripts/e2e/cms-media/environment.example.json", "utf8"));
    await writeFile(file, JSON.stringify({ ...example, CMS_MEDIA_E2E_API_PORT: String(port) }));
    const inherited = Object.fromEntries(Object.entries(process.env).filter(([key]) => !key.startsWith("CMS_MEDIA_E2E_")));
    const command = promisify(execFile)(process.execPath, [
      "node_modules/@playwright/test/cli.js", "test", "--config", "playwright.cms-media.config.ts",
      "--output", path.join(temp, "results"), "e2e/cms-media/page-hero-image-preview.spec.ts",
    ], {
      encoding: "utf8",
      timeout: 15_000,
      env: {
        ...inherited,
        NODE_ENV: "test",
        CMS_MEDIA_E2E_ENV_FILE: file,
        CMS_MEDIA_E2E_BACKEND_ROOT: temp,
        CMS_MEDIA_E2E_FRONTEND_ROOT: temp,
      },
    });
    await expect(command).rejects.toMatchObject({
      code: 1,
      stderr: expect.stringContaining("database identity/schema check failed"),
    });
    await expect(command).rejects.toMatchObject({ stderr: expect.not.stringContaining("Backend startup marker") });
    expect(readinessProbes).toBeGreaterThan(0);
  } finally {
    if (readiness.listening) await new Promise<void>((resolve, reject) =>
      readiness.close(error => error ? reject(error) : resolve()));
    await rm(temp, { recursive: true, force: true });
  }
}, 20_000);
