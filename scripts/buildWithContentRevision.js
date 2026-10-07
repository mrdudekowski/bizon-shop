import { spawn } from "node:child_process";
import { mkdir, rename, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const markerPath = path.join(root, "out", "content-revision.json");
const markerTempPath = `${markerPath}.tmp`;

function validRevision(value) {
  return value != null
    && typeof value === "object"
    && value.schema === 1
    && typeof value.revision === "string"
    && /^sha256:[a-f0-9]{64}$/.test(value.revision);
}

async function fetchRevision() {
  const baseUrl = process.env.CONTENT_API_URL?.trim();
  if (!baseUrl) throw new Error("CONTENT_API_URL is required to build a verified static site");
  const parsedBase = new URL(baseUrl);
  if (!new Set(["http:", "https:"]).has(parsedBase.protocol) || parsedBase.username || parsedBase.password || parsedBase.search || parsedBase.hash) {
    throw new Error("CONTENT_API_URL must be an HTTP(S) base URL without credentials, query, or fragment");
  }
  const response = await fetch(new URL(`${parsedBase.href.replace(/\/+$/, "")}/v1/content/revision`), {
    cache: "no-store",
    redirect: "error",
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) throw new Error(`Content revision API returned HTTP ${response.status}`);
  const payload = await response.json();
  if (!validRevision(payload)) throw new Error("Content revision API returned an invalid payload");
  return payload;
}

function runNextBuild() {
  return new Promise((resolve, reject) => {
    const nextBin = path.join(root, "node_modules", "next", "dist", "bin", "next");
    const child = spawn(process.execPath, [nextBin, "build"], {
      cwd: root,
      env: process.env,
      stdio: "inherit",
    });
    child.once("error", reject);
    child.once("exit", (code, signal) => {
      if (code === 0) resolve();
      else reject(new Error(`Next.js build failed${signal ? ` with signal ${signal}` : ` with exit code ${code}`}`));
    });
  });
}

async function main() {
  try {
    await rm(markerPath, { force: true });
    await rm(markerTempPath, { force: true });
    const before = await fetchRevision();
    await runNextBuild();
    const after = await fetchRevision();
    if (before.revision !== after.revision) {
      throw new Error("Published content changed during the static build; refusing to mark this export as current");
    }

    await mkdir(path.dirname(markerPath), { recursive: true });
    await writeFile(markerTempPath, `${JSON.stringify({ ...after, builtAt: new Date().toISOString() }, null, 2)}\n`, "utf8");
    await rename(markerTempPath, markerPath);
  } catch (error) {
    await rm(markerPath, { force: true });
    await rm(markerTempPath, { force: true });
    console.error(error instanceof Error ? error.message : "Static build revision verification failed");
    process.exitCode = 1;
  }
}

await main();
