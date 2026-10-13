import { createHash } from "node:crypto";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { validateStaticExport } from "../../../scripts/validateStaticExport.js";

const revision = `sha256:${"a".repeat(64)}`;
const directories: string[] = [];

async function makeExport() {
  const root = await mkdtemp(path.join(os.tmpdir(), "bizon-static-export-check-"));
  directories.push(root);
  const outDir = path.join(root, "out");
  await mkdir(path.join(outDir, "styles"), { recursive: true });
  await mkdir(path.join(outDir, "images"), { recursive: true });
  await mkdir(path.join(outDir, "fonts"), { recursive: true });
  await writeFile(path.join(outDir, "index.html"), [
    "<!doctype html><html><head><title>Home page</title>",
    '<link rel="canonical" href="https://site.test/">',
    '<link rel="stylesheet" href="/styles/site.css">',
    '</head><body><h1>Home</h1><img src="/images/card.png"></body></html>',
  ].join(""));
  await writeFile(path.join(outDir, "styles", "site.css"), "@font-face { src: url('/fonts/site.woff2'); }");
  await writeFile(path.join(outDir, "images", "card.png"), "fixture image");
  await writeFile(path.join(outDir, "fonts", "site.woff2"), "fixture font");
  await writeFile(path.join(outDir, "robots.txt"), "User-Agent: *\nAllow: /\n\nSitemap: https://site.test/sitemap.xml\n");
  await writeFile(path.join(outDir, "sitemap.xml"), "<urlset><url><loc>https://site.test/</loc></url></urlset>");
  await writeFile(path.join(outDir, "media-manifest.json"), JSON.stringify({ schema: 1, revision, files: [] }));
  return outDir;
}

afterEach(async () => {
  await Promise.all(directories.splice(0).map((directory) => rm(directory, { recursive: true, force: true })));
});

describe("static export validation", () => {
  it("checks route HTML, canonicals, robots, sitemap, CSS, and local assets", async () => {
    const outDir = await makeExport();
    await expect(validateStaticExport({ outDir, siteUrl: "https://site.test/", revision }))
      .resolves.toEqual({ routeCount: 1, mediaCount: 0 });
  });

  it("rejects an incorrect canonical before a release can be marked ready", async () => {
    const outDir = await makeExport();
    await writeFile(path.join(outDir, "index.html"), '<title>Home</title><link rel="canonical" href="https://wrong.test/"><h1>Home</h1>');
    await expect(validateStaticExport({ outDir, siteUrl: "https://site.test/", revision }))
      .rejects.toThrow("canonical does not match its sitemap route");
  });

  it("verifies the bytes of every snapshotted media file against its manifest hash", async () => {
    const outDir = await makeExport();
    const bytes = Buffer.from("verified media bytes");
    const checksum = createHash("sha256").update(bytes).digest("hex");
    await mkdir(path.join(outDir, "snapshot-media"), { recursive: true });
    await writeFile(path.join(outDir, "snapshot-media", `${checksum}.png`), bytes);
    await writeFile(path.join(outDir, "media-manifest.json"), JSON.stringify({
      schema: 1,
      revision,
      files: [{ path: `/snapshot-media/${checksum}.png`, byteSize: bytes.length, sha256: checksum }],
    }));

    await expect(validateStaticExport({ outDir, siteUrl: "https://site.test/", revision }))
      .resolves.toEqual({ routeCount: 1, mediaCount: 1 });
    await writeFile(path.join(outDir, "snapshot-media", `${checksum}.png`), "tampered");
    await expect(validateStaticExport({ outDir, siteUrl: "https://site.test/", revision }))
      .rejects.toThrow("does not match its size or SHA-256");
  });
});
