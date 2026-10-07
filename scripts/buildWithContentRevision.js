import { spawn } from "node:child_process";
import { mkdir, rename, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const markerPath = path.join(root, "out", "content-revision.json");
const markerTempPath = `${markerPath}.tmp`;
const MAX_REVISION_ATTEMPTS = 3;

function validRevision(value) {
  return value != null
    && typeof value === "object"
    && value.schema === 1
    && typeof value.revision === "string"
    && /^sha256:[a-f0-9]{64}$/.test(value.revision);
}

export async function fetchRevision({
  baseUrl = process.env.CONTENT_API_URL?.trim(),
  fetchImpl = fetch,
  wait = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds)),
} = {}) {
  if (!baseUrl) throw new Error("CONTENT_API_URL is required to build a verified static site");
  const parsedBase = new URL(baseUrl);
  if (!new Set(["http:", "https:"]).has(parsedBase.protocol) || parsedBase.username || parsedBase.password || parsedBase.search || parsedBase.hash) {
    throw new Error("CONTENT_API_URL must be an HTTP(S) base URL without credentials, query, or fragment");
  }
  const url = new URL(`${parsedBase.href.replace(/\/+$/, "")}/v1/content/revision`);

  for (let attempt = 1; attempt <= MAX_REVISION_ATTEMPTS; attempt += 1) {
    try {
      const response = await fetchImpl(url, {
        cache: "no-store",
        redirect: "error",
        signal: AbortSignal.timeout(10_000),
      });
      if (!response.ok) {
        const error = new Error(`Content revision API returned HTTP ${response.status}`);
        error.retryable = new Set([408, 425, 429, 500, 502, 503, 504]).has(response.status);
        throw error;
      }
      const payload = await response.json();
      if (!validRevision(payload)) throw new Error("Content revision API returned an invalid payload");
      return payload;
    } catch (error) {
      const retryable = error?.retryable === true
        || error?.name === "AbortError"
        || error?.name === "TimeoutError"
        || error instanceof TypeError;
      if (!retryable || attempt === MAX_REVISION_ATTEMPTS) throw error;
      await wait(500 * (2 ** (attempt - 1)));
    }
  }

  throw new Error("Content revision API request attempts exhausted");
}

export async function runStableRevisionBuild({ fetchRevision, runBuild, writeMarker }) {
  const before = await fetchRevision();
  await runBuild();
  const after = await fetchRevision();
  if (before.revision !== after.revision) {
    throw new Error("Published content changed during the static build; refusing to mark this export as current");
  }
  await writeMarker(after);
}

async function writeRevisionMarker(revision) {
  await mkdir(path.dirname(markerPath), { recursive: true });
  await writeFile(markerTempPath, `${JSON.stringify({ ...revision, builtAt: new Date().toISOString() }, null, 2)}\n`, "utf8");
  await rename(markerTempPath, markerPath);
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
    await runStableRevisionBuild({
      fetchRevision,
      runBuild: runNextBuild,
      writeMarker: writeRevisionMarker,
    });
  } catch (error) {
    await rm(markerPath, { force: true });
    await rm(markerTempPath, { force: true });
    console.error(error instanceof Error ? error.message : "Static build revision verification failed");
    process.exitCode = 1;
  }
}

const isDirectExecution = process.argv[1]
  && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isDirectExecution) await main();
