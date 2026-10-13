import { createHash, randomUUID } from "node:crypto";
import { access, mkdir, readFile, readdir, rename, writeFile } from "node:fs/promises";
import path from "node:path";

export const MAX_SNAPSHOT_MEDIA_BYTES = 20 * 1024 * 1024;
export const SNAPSHOT_MEDIA_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "video/mp4",
  "application/pdf",
]);

const TEXT_FILE_EXTENSIONS = new Set([".html", ".txt", ".json", ".js", ".css", ".xml", ".webmanifest"]);
const EXTENSION_BY_MIME = new Map([
  ["image/jpeg", ".jpg"],
  ["image/png", ".png"],
  ["image/webp", ".webp"],
  ["video/mp4", ".mp4"],
  ["application/pdf", ".pdf"],
]);

function sha256(buffer) {
  return createHash("sha256").update(buffer).digest("hex");
}

function normalizePublicBase(publicMediaUrl) {
  if (typeof publicMediaUrl !== "string" || !publicMediaUrl.trim()) {
    throw new Error("S3_PUBLIC_URL is required to create a media snapshot");
  }
  const base = new URL(publicMediaUrl.trim());
  if (!new Set(["http:", "https:"]).has(base.protocol) || base.username || base.password || base.search || base.hash) {
    throw new Error("S3_PUBLIC_URL must be an HTTP(S) base URL without credentials, query, or fragment");
  }
  base.pathname = `${base.pathname.replace(/\/+$/, "")}/`;
  return base;
}

function canonicalUrl(candidate) {
  return candidate
    .replace(/&amp;/g, "&")
    .replace(/\\u0026/gi, "&")
    .replace(/[),;]+$/, "");
}

function managedMediaUrl(value, base) {
  let parsed;
  try {
    parsed = new URL(value);
  } catch {
    return null;
  }
  if (parsed.origin !== base.origin || !parsed.pathname.startsWith(base.pathname)) return null;
  if (parsed.username || parsed.password || parsed.search || parsed.hash) {
    throw new Error("S3 media URLs must be public, stable URLs without credentials, query, or fragment");
  }
  return parsed.href;
}

async function listTextFiles(directory, relative = "") {
  const entries = await readdir(path.join(directory, relative), { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const entryRelative = path.join(relative, entry.name);
    if (entry.isDirectory()) {
      files.push(...await listTextFiles(directory, entryRelative));
    } else if (entry.isFile() && TEXT_FILE_EXTENSIONS.has(path.extname(entry.name).toLowerCase())) {
      files.push(entryRelative);
    }
  }
  return files;
}

async function pathExists(target) {
  try {
    await access(target);
    return true;
  } catch {
    return false;
  }
}

function contentType(response) {
  return (response.headers.get("content-type") ?? "").split(";", 1)[0].trim().toLowerCase();
}

function hasExpectedSignature(body, mimeType) {
  if (mimeType === "image/png") return body.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  if (mimeType === "image/jpeg") return body.length >= 3 && body[0] === 0xff && body[1] === 0xd8 && body[2] === 0xff;
  if (mimeType === "image/webp") return body.length >= 12 && body.toString("ascii", 0, 4) === "RIFF" && body.toString("ascii", 8, 12) === "WEBP";
  if (mimeType === "application/pdf") return body.subarray(0, 5).toString("ascii") === "%PDF-";
  if (mimeType === "video/mp4") return body.length >= 8 && body.toString("ascii", 4, 8) === "ftyp";
  return false;
}

async function downloadMedia(sourceUrl, { fetchImpl, maxBytes }) {
  const response = await fetchImpl(sourceUrl, {
    method: "GET",
    cache: "no-store",
    redirect: "error",
    signal: AbortSignal.timeout(30_000),
  });
  if (!response.ok) throw new Error(`Media snapshot download failed with HTTP ${response.status}`);

  const mimeType = contentType(response);
  if (!SNAPSHOT_MEDIA_TYPES.has(mimeType)) throw new Error(`Media snapshot has unsupported media type: ${mimeType || "missing"}`);
  const declaredLength = Number(response.headers.get("content-length"));
  if (Number.isFinite(declaredLength) && declaredLength > maxBytes) throw new Error("Media snapshot file exceeds the configured size limit");

  const body = Buffer.from(await response.arrayBuffer());
  if (!body.length || body.length > maxBytes) throw new Error("Media snapshot file is empty or exceeds the configured size limit");
  if (!hasExpectedSignature(body, mimeType)) throw new Error(`Media snapshot bytes do not match ${mimeType}`);
  return { body, mimeType, sha256: sha256(body) };
}

async function readPreviousMediaManifest(previousOutputDir, previousManifest) {
  if (previousManifest?.schema === 1 && Array.isArray(previousManifest.files)) {
    return new Map(previousManifest.files
      .filter((file) => typeof file?.sourceUrl === "string")
      .map((file) => [file.sourceUrl, file]));
  }
  if (!previousOutputDir) return new Map();
  try {
    const parsed = JSON.parse(await readFile(path.join(previousOutputDir, "media-manifest.json"), "utf8"));
    if (parsed?.schema !== 1 || !Array.isArray(parsed.files)) return new Map();
    return new Map(parsed.files
      .filter((file) => typeof file?.sourceUrl === "string")
      .map((file) => [file.sourceUrl, file]));
  } catch {
    return new Map();
  }
}

async function reusePreviousMedia(sourceUrl, previousOutputDir, previousFiles, maxBytes, fetchPreviousFile) {
  const previous = previousFiles.get(sourceUrl);
  if (!previous || (!previousOutputDir && typeof fetchPreviousFile !== "function")) return null;
  if (typeof previous.path !== "string"
    || !/^\/snapshot-media\/[a-f0-9]{64}\.(jpg|png|webp|mp4|pdf)$/.test(previous.path)
    || !SNAPSHOT_MEDIA_TYPES.has(previous.mimeType)
    || !/^[a-f0-9]{64}$/.test(previous.sha256)
    || !Number.isSafeInteger(previous.byteSize)
    || previous.byteSize <= 0
    || previous.byteSize > maxBytes) return null;

  let body;
  try {
    if (previousOutputDir) {
      const previousPath = path.resolve(previousOutputDir, `.${previous.path}`);
      const mediaRoot = path.resolve(previousOutputDir, "snapshot-media");
      if (!previousPath.startsWith(`${mediaRoot}${path.sep}`)) return null;
      body = await readFile(previousPath);
    } else {
      body = Buffer.from(await fetchPreviousFile(previous.path, previous));
    }
    if (body.length !== previous.byteSize
      || sha256(body) !== previous.sha256
      || !hasExpectedSignature(body, previous.mimeType)) return null;
    return { body, mimeType: previous.mimeType, sha256: previous.sha256, reusedFromPreviousRelease: true };
  } catch {
    return null;
  }
}

/**
 * Copy every referenced object under S3_PUBLIC_URL into the static export and rewrite
 * the exported HTML/RSC payloads to same-origin paths before the build is promoted.
 */
export async function createMediaSnapshot({
  outDir,
  previousOutputDir = undefined,
  previousManifest = undefined,
  fetchPreviousFile = undefined,
  revision,
  publicMediaUrl,
  fetchImpl = fetch,
  maxBytes = MAX_SNAPSHOT_MEDIA_BYTES,
  now = () => new Date().toISOString(),
}) {
  if (!outDir || typeof revision !== "string" || !/^sha256:[a-f0-9]{64}$/.test(revision)) {
    throw new Error("A static output directory and valid content revision are required for the media snapshot");
  }
  const base = normalizePublicBase(publicMediaUrl);
  const textFiles = await listTextFiles(outDir);
  const previousFiles = await readPreviousMediaManifest(previousOutputDir, previousManifest);
  const contents = new Map();
  const referencedUrls = new Set();

  for (const relativePath of textFiles) {
    const content = await readFile(path.join(outDir, relativePath), "utf8");
    contents.set(relativePath, content);
    for (const match of content.matchAll(/https?:\/\/[^\s"'<>\\]+/g)) {
      const url = managedMediaUrl(canonicalUrl(match[0]), base);
      if (url) referencedUrls.add(url);
    }
  }

  const files = [];
  const replacements = new Map();
  for (const sourceUrl of [...referencedUrls].sort()) {
    let downloaded;
    try {
      downloaded = await downloadMedia(sourceUrl, { fetchImpl, maxBytes });
    } catch (error) {
      downloaded = await reusePreviousMedia(sourceUrl, previousOutputDir, previousFiles, maxBytes, fetchPreviousFile);
      if (!downloaded) throw error;
    }
    const extension = EXTENSION_BY_MIME.get(downloaded.mimeType);
    const relativePath = `snapshot-media/${downloaded.sha256}${extension}`;
    const targetPath = path.join(outDir, relativePath);
    await mkdir(path.dirname(targetPath), { recursive: true });
    await writeFile(targetPath, downloaded.body);
    replacements.set(sourceUrl, `/${relativePath}`);
    const parsed = new URL(sourceUrl);
    files.push({
      sourceKey: decodeURIComponent(parsed.pathname.slice(base.pathname.length)),
      sourceUrl,
      path: `/${relativePath}`,
      mimeType: downloaded.mimeType,
      byteSize: downloaded.body.length,
      sha256: downloaded.sha256,
      ...(downloaded.reusedFromPreviousRelease ? { reusedFromPreviousRelease: true } : {}),
    });
  }

  for (const [relativePath, original] of contents) {
    let rewritten = original;
    rewritten = rewritten.replace(/https?:\/\/[^\s"'<>\\]+/g, (raw) => {
      const trimmed = raw.replace(/[),;]+$/, "");
      const sourceUrl = managedMediaUrl(canonicalUrl(trimmed), base);
      const localPath = sourceUrl ? replacements.get(sourceUrl) : undefined;
      return localPath ? `${localPath}${raw.slice(trimmed.length)}` : raw;
    });
    const remaining = [...rewritten.matchAll(/https?:\/\/[^\s"'<>\\]+/g)]
      .map(([url]) => managedMediaUrl(canonicalUrl(url), base))
      .filter(Boolean);
    if (remaining.length > 0) throw new Error("Media snapshot left an external S3 reference in the static output");
    if (rewritten !== original) await writeFile(path.join(outDir, relativePath), rewritten, "utf8");
  }

  const manifest = { schema: 1, revision, generatedAt: now(), files };
  const manifestPath = path.join(outDir, "media-manifest.json");
  const temporaryManifestPath = `${manifestPath}.tmp`;
  await writeFile(temporaryManifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  await rename(temporaryManifestPath, manifestPath);

  const manifestSha256 = sha256(Buffer.from(`${JSON.stringify(manifest, null, 2)}\n`, "utf8"));
  return { manifestPath: "/media-manifest.json", manifestSha256, mediaCount: files.length };
}
