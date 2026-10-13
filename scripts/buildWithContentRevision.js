import { spawn } from "node:child_process";
import { access, mkdir, mkdtemp, rename, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { randomUUID } from "node:crypto";
import nextEnv from "@next/env";
import { createMediaSnapshot } from "./snapshotStaticMedia.js";
import { validateStaticExport } from "./validateStaticExport.js";

const { loadEnvConfig } = nextEnv;

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const markerPath = path.join(root, "out", "content-revision.json");
const markerTempPath = `${markerPath}.tmp`;
const contentSnapshotPath = path.join(root, "out", "content-snapshot.json");
const contentSnapshotTempPath = `${contentSnapshotPath}.tmp`;
const outDir = path.join(root, "out");
const previousSnapshotPath = path.join(root, ".content-snapshot-previous");
const MAX_REVISION_ATTEMPTS = 3;

function validRevision(value) {
  return value != null
    && typeof value === "object"
    && value.schema === 1
    && typeof value.revision === "string"
    && /^sha256:[a-f0-9]{64}$/.test(value.revision);
}

function validSnapshot(value) {
  const content = value?.content;
  return value != null
    && typeof value === "object"
    && value.schema === 1
    && typeof value.revision === "string"
    && /^sha256:[a-f0-9]{64}$/.test(value.revision)
    && content != null
    && typeof content === "object"
    && !Array.isArray(content)
    && (content.home === null || (content.home != null && typeof content.home === "object" && !Array.isArray(content.home)))
    && (content.shopHome === null || (content.shopHome != null && typeof content.shopHome === "object" && !Array.isArray(content.shopHome)))
    && content.stubs != null && typeof content.stubs === "object" && !Array.isArray(content.stubs)
    && Array.isArray(content.articles)
    && Array.isArray(content.tires?.types) && Array.isArray(content.tires?.models)
    && Array.isArray(content.wheels?.types) && Array.isArray(content.wheels?.byType)
    && Array.isArray(content.shop?.categories) && Array.isArray(content.shop?.products);
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

export async function fetchPublishedSnapshot({
  baseUrl = process.env.CONTENT_API_URL?.trim(),
  fetchImpl = fetch,
} = {}) {
  if (!baseUrl) throw new Error("CONTENT_API_URL is required to build a verified static site");
  const parsedBase = new URL(baseUrl);
  if (!new Set(["http:", "https:"]).has(parsedBase.protocol) || parsedBase.username || parsedBase.password || parsedBase.search || parsedBase.hash) {
    throw new Error("CONTENT_API_URL must be an HTTP(S) base URL without credentials, query, or fragment");
  }
  const url = new URL(`${parsedBase.href.replace(/\/+$/, "")}/v1/content/snapshot`);
  const response = await fetchImpl(url, {
    cache: "no-store",
    redirect: "error",
    signal: AbortSignal.timeout(30_000),
  });
  if (!response.ok) throw new Error(`Published content snapshot API returned HTTP ${response.status}`);
  const payload = await response.json();
  if (!validSnapshot(payload)) throw new Error("Published content snapshot API returned an invalid payload");
  return payload;
}

export async function fetchPreviousMediaManifest({
  publicSiteUrl = process.env.PUBLIC_SITE_URL?.trim(),
  fetchImpl = fetch,
} = {}) {
  if (!publicSiteUrl) return null;
  let siteUrl;
  try {
    siteUrl = new URL(publicSiteUrl);
  } catch {
    return null;
  }
  if (siteUrl.protocol !== "https:" || siteUrl.username || siteUrl.password || siteUrl.pathname !== "/" || siteUrl.search || siteUrl.hash) {
    return null;
  }

  try {
    const response = await fetchImpl(new URL("/media-manifest.json", siteUrl), {
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) return null;
    const manifest = await response.json();
    return manifest?.schema === 1
      && typeof manifest.revision === "string"
      && /^sha256:[a-f0-9]{64}$/.test(manifest.revision)
      && Array.isArray(manifest.files)
      ? { siteUrl, manifest }
      : null;
  } catch {
    return null;
  }
}

export async function fetchPreviousContentSnapshot({
  publicSiteUrl = process.env.PUBLIC_SITE_URL?.trim(),
  fetchImpl = fetch,
} = {}) {
  if (!publicSiteUrl) return null;
  let siteUrl;
  try {
    siteUrl = new URL(publicSiteUrl);
  } catch {
    return null;
  }
  if (siteUrl.protocol !== "https:" || siteUrl.username || siteUrl.password || siteUrl.pathname !== "/" || siteUrl.search || siteUrl.hash) {
    return null;
  }
  try {
    const response = await fetchImpl(new URL("/content-snapshot.json", siteUrl), {
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) return null;
    const snapshot = await response.json();
    return validSnapshot(snapshot) ? snapshot : null;
  } catch {
    return null;
  }
}

export async function fetchPreviousMediaFile(pathname, siteUrl, fetchImpl = fetch) {
  if (!siteUrl || typeof pathname !== "string" || !/^\/snapshot-media\/[a-f0-9]{64}\.(jpg|png|webp|mp4|pdf)$/.test(pathname)) {
    throw new Error("Previous media path is invalid");
  }
  const response = await fetchImpl(new URL(pathname, siteUrl), {
    cache: "no-store",
    redirect: "error",
    signal: AbortSignal.timeout(30_000),
  });
  if (!response.ok) throw new Error(`Previous release media returned HTTP ${response.status}`);
  return Buffer.from(await response.arrayBuffer());
}

export async function runStableRevisionBuild({
  fetchRevision,
  fetchSnapshot = undefined,
  runBuild,
  runSnapshot = undefined,
  validateExport = undefined,
  writeMarker,
  previousOutputDir = null,
}) {
  const before = await fetchRevision();
  const snapshot = fetchSnapshot ? await fetchSnapshot() : undefined;
  if (snapshot && snapshot.revision !== before.revision) {
    throw new Error("Published content changed before the static build snapshot was captured");
  }
  await runBuild(snapshot);
  const mediaSnapshot = runSnapshot ? await runSnapshot(before, { previousOutputDir }) : undefined;
  if (validateExport) await validateExport(before);
  const after = await fetchRevision();
  if (before.revision !== after.revision) {
    throw new Error("Published content changed during the static build; refusing to mark this export as current");
  }
  if (mediaSnapshot === undefined && snapshot === undefined) await writeMarker(after);
  else await writeMarker(after, mediaSnapshot, snapshot);
}

async function writeRevisionMarker(revision, mediaSnapshot, contentSnapshot) {
  await mkdir(path.dirname(markerPath), { recursive: true });
  if (contentSnapshot) {
    await writeFile(contentSnapshotTempPath, `${JSON.stringify(contentSnapshot, null, 2)}\n`, "utf8");
    await rename(contentSnapshotTempPath, contentSnapshotPath);
  }
  const marker = {
    ...revision,
    builtAt: new Date().toISOString(),
    ...(mediaSnapshot ? { mediaSnapshot } : {}),
    ...(contentSnapshot ? { contentSnapshotPath: "/content-snapshot.json" } : {}),
  };
  await writeFile(markerTempPath, `${JSON.stringify(marker, null, 2)}\n`, "utf8");
  await rename(markerTempPath, markerPath);
}

async function pathExists(target) {
  try {
    await access(target);
    return true;
  } catch {
    return false;
  }
}

/** Keep the last successful output available until build, media snapshot, and revision checks pass. */
export async function runAtomicStaticBuild({
  outDir,
  previousDir,
  runBuild,
  runSnapshot,
}) {
  if (!outDir || !previousDir || typeof runBuild !== "function" || typeof runSnapshot !== "function") {
    throw new Error("Atomic static build requires output paths and build/snapshot functions");
  }
  const transactionDir = path.join(path.dirname(outDir), `.content-snapshot-transaction-${randomUUID()}`);
  const activeBackup = path.join(transactionDir, "active-output");
  const previousBackup = path.join(transactionDir, "previous-output");
  let activeMoved = false;
  let previousMoved = false;
  let keepTransaction = false;
  await mkdir(transactionDir, { recursive: true });

  try {
    if (await pathExists(outDir)) {
      await rename(outDir, activeBackup);
      activeMoved = true;
    }
    if (await pathExists(previousDir)) {
      await rename(previousDir, previousBackup);
      previousMoved = true;
    }

    const previousOutputDir = activeMoved ? activeBackup : previousMoved ? previousBackup : null;
    await runBuild({ previousOutputDir });
    const snapshot = await runSnapshot({ previousOutputDir });

    if (activeMoved) {
      await mkdir(path.dirname(previousDir), { recursive: true });
      await rename(activeBackup, previousDir);
      activeMoved = false;
    } else if (previousMoved) {
      await rename(previousBackup, previousDir);
      previousMoved = false;
    }
    if (previousMoved) await rm(previousBackup, { recursive: true, force: true }).catch(() => {});
    return snapshot;
  } catch (error) {
    let rollbackError;
    try {
      await rm(outDir, { recursive: true, force: true });
      if (activeMoved) {
        await rename(activeBackup, outDir);
        activeMoved = false;
      }
      if (previousMoved) {
        await rename(previousBackup, previousDir);
        previousMoved = false;
      }
    } catch (failure) {
      rollbackError = failure;
      keepTransaction = true;
    }
    if (rollbackError) {
      throw new AggregateError([error, rollbackError], `Static build failed and rollback data was retained at ${transactionDir}`);
    }
    throw error;
  } finally {
    if (!keepTransaction) await rm(transactionDir, { recursive: true, force: true }).catch(() => {});
  }
}

async function runNextBuild(snapshot) {
  const temporaryDirectory = snapshot ? await mkdtemp(path.join(tmpdir(), "bizon-static-build-")) : null;
  const snapshotFile = temporaryDirectory ? path.join(temporaryDirectory, "published-content.json") : null;
  if (snapshotFile) await writeFile(snapshotFile, `${JSON.stringify(snapshot)}\n`, "utf8");
  try {
    await new Promise((resolve, reject) => {
      const nextBin = path.join(root, "node_modules", "next", "dist", "bin", "next");
      const child = spawn(process.execPath, [nextBin, "build"], {
        cwd: root,
        env: snapshotFile ? { ...process.env, CONTENT_SNAPSHOT_FILE: snapshotFile } : process.env,
        stdio: "inherit",
      });
      child.once("error", reject);
      child.once("exit", (code, signal) => {
        if (code === 0) resolve();
        else reject(new Error(`Next.js build failed${signal ? ` with signal ${signal}` : ` with exit code ${code}`}`));
      });
    });
  } finally {
    if (temporaryDirectory) await rm(temporaryDirectory, { recursive: true, force: true }).catch(() => {});
  }
}

async function main() {
  loadEnvConfig(root);
  try {
    const previousRelease = await fetchPreviousMediaManifest();
    await runAtomicStaticBuild({
      outDir,
      previousDir: previousSnapshotPath,
      runBuild: ({ previousOutputDir } = {}) => runStableRevisionBuild({
        fetchRevision,
        fetchSnapshot: fetchPublishedSnapshot,
        runBuild: runNextBuild,
        previousOutputDir,
        runSnapshot: (revision, { previousOutputDir: previousReleaseDirectory } = {}) => createMediaSnapshot({
          outDir,
          previousOutputDir: previousReleaseDirectory,
          previousManifest: previousRelease?.manifest,
          fetchPreviousFile: previousRelease
            ? (pathname) => fetchPreviousMediaFile(pathname, previousRelease.siteUrl)
            : undefined,
          revision: revision.revision,
          publicMediaUrl: process.env.S3_PUBLIC_URL,
        }),
        validateExport: (revision) => validateStaticExport({
          outDir,
          siteUrl: process.env.NEXT_PUBLIC_SITE_URL,
          revision: revision.revision,
        }),
        writeMarker: writeRevisionMarker,
      }),
      runSnapshot: async () => undefined,
    });
  } catch (error) {
    console.error(error instanceof Error ? error.message : "Static build revision verification failed");
    process.exitCode = 1;
  }
}

const isDirectExecution = process.argv[1]
  && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isDirectExecution) await main();
