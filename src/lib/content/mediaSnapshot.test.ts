import { createHash } from "node:crypto";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createMediaSnapshot } from "../../../scripts/snapshotStaticMedia.js";
import { runAtomicStaticBuild } from "../../../scripts/buildWithContentRevision.js";

const temporaryDirectories: string[] = [];
const revision = `sha256:${"a".repeat(64)}`;

async function temporaryDirectory() {
  const directory = await mkdtemp(path.join(os.tmpdir(), "bizon-media-snapshot-"));
  temporaryDirectories.push(directory);
  return directory;
}

afterEach(async () => {
  await Promise.all(temporaryDirectories.splice(0).map((directory) => rm(directory, { recursive: true, force: true })));
});

describe("static media snapshot", () => {
  it("copies referenced S3 media, rewrites exported references, and records a checksum manifest", async () => {
    const outDir = await temporaryDirectory();
    const sourceUrl = "https://media.example/bucket/bizon/media/wheel.png";
    const body = Buffer.concat([
      Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
      Buffer.from("snapshot fixture"),
    ]);
    await writeFile(path.join(outDir, "index.html"), `<img src="${sourceUrl}" alt="Wheel">`);
    await writeFile(path.join(outDir, "index.txt"), JSON.stringify({ imageUrl: sourceUrl }));
    const fetchImpl = vi.fn().mockResolvedValue(new Response(body, {
      status: 200,
      headers: { "content-type": "image/png" },
    }));

    const summary = await createMediaSnapshot({
      outDir,
      revision,
      publicMediaUrl: "https://media.example/bucket",
      fetchImpl,
    });

    const checksum = createHash("sha256").update(body).digest("hex");
    const localPath = `/snapshot-media/${checksum}.png`;
    const manifest = JSON.parse(await readFile(path.join(outDir, "media-manifest.json"), "utf8"));
    expect(manifest).toMatchObject({ schema: 1, revision, files: [{ path: localPath, mimeType: "image/png", byteSize: body.length, sha256: checksum }] });
    expect(summary).toMatchObject({ manifestPath: "/media-manifest.json", mediaCount: 1 });
    expect(await readFile(path.join(outDir, "index.html"), "utf8")).toContain(localPath);
    expect(await readFile(path.join(outDir, "index.txt"), "utf8")).toContain(localPath);
    expect(await readFile(path.join(outDir, localPath.slice(1)))).toEqual(body);
    expect(await readFile(path.join(outDir, "media-manifest.json"), "utf8")).toContain(checksum);
    expect(fetchImpl).toHaveBeenCalledOnce();
  });

  it("rejects missing or unsafe media instead of writing a complete manifest", async () => {
    const outDir = await temporaryDirectory();
    const sourceUrl = "https://media.example/bucket/bizon/media/wheel.svg";
    await writeFile(path.join(outDir, "index.html"), `<img src="${sourceUrl}">`);

    await expect(createMediaSnapshot({
      outDir,
      revision,
      publicMediaUrl: "https://media.example/bucket",
      fetchImpl: vi.fn().mockResolvedValue(new Response("<svg/>", {
        status: 200,
        headers: { "content-type": "image/svg+xml" },
      })),
    })).rejects.toThrow(/unsupported media type/i);

    await expect(readFile(path.join(outDir, "media-manifest.json"))).rejects.toMatchObject({ code: "ENOENT" });
  });

  it("reuses only the checksum-verified prior copy of the same source URL when S3 is unavailable", async () => {
    const root = await temporaryDirectory();
    const outDir = path.join(root, "new-output");
    const previousOutputDir = path.join(root, "previous-output");
    const sourceUrl = "https://media.example/bucket/bizon/media/wheel.png";
    const body = Buffer.concat([
      Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
      Buffer.from("last verified wheel image"),
    ]);
    const checksum = createHash("sha256").update(body).digest("hex");
    const localPath = `/snapshot-media/${checksum}.png`;
    await mkdir(path.join(outDir), { recursive: true });
    await mkdir(path.join(previousOutputDir, "snapshot-media"), { recursive: true });
    await writeFile(path.join(outDir, "index.html"), `<img src="${sourceUrl}" alt="Wheel">`);
    await writeFile(path.join(previousOutputDir, localPath.slice(1)), body);
    await writeFile(path.join(previousOutputDir, "media-manifest.json"), JSON.stringify({
      schema: 1,
      revision: `sha256:${"b".repeat(64)}`,
      files: [{
        sourceKey: "bizon/media/wheel.png",
        sourceUrl,
        path: localPath,
        mimeType: "image/png",
        byteSize: body.length,
        sha256: checksum,
      }],
    }));
    const fetchImpl = vi.fn().mockRejectedValue(new TypeError("S3 unavailable"));

    await createMediaSnapshot({
      outDir,
      previousOutputDir,
      revision,
      publicMediaUrl: "https://media.example/bucket",
      fetchImpl,
    });

    const manifest = JSON.parse(await readFile(path.join(outDir, "media-manifest.json"), "utf8"));
    expect(manifest.files).toMatchObject([{
      sourceUrl,
      path: localPath,
      sha256: checksum,
      reusedFromPreviousRelease: true,
    }]);
    expect(await readFile(path.join(outDir, localPath.slice(1)))).toEqual(body);
    expect(await readFile(path.join(outDir, "index.html"), "utf8")).toContain(localPath);
    expect(fetchImpl).toHaveBeenCalledOnce();
  });

  it("does not reuse a previous file for a different source URL", async () => {
    const root = await temporaryDirectory();
    const outDir = path.join(root, "new-output");
    const previousOutputDir = path.join(root, "previous-output");
    const oldUrl = "https://media.example/bucket/bizon/media/old.png";
    const newUrl = "https://media.example/bucket/bizon/media/new.png";
    const body = Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), Buffer.from("old image")]);
    const checksum = createHash("sha256").update(body).digest("hex");
    const localPath = `/snapshot-media/${checksum}.png`;
    await mkdir(outDir, { recursive: true });
    await mkdir(path.join(previousOutputDir, "snapshot-media"), { recursive: true });
    await writeFile(path.join(outDir, "index.html"), `<img src="${newUrl}">`);
    await writeFile(path.join(previousOutputDir, localPath.slice(1)), body);
    await writeFile(path.join(previousOutputDir, "media-manifest.json"), JSON.stringify({
      schema: 1,
      files: [{ sourceUrl: oldUrl, path: localPath, mimeType: "image/png", byteSize: body.length, sha256: checksum }],
    }));

    await expect(createMediaSnapshot({
      outDir,
      previousOutputDir,
      revision,
      publicMediaUrl: "https://media.example/bucket",
      fetchImpl: vi.fn().mockRejectedValue(new TypeError("S3 unavailable")),
    })).rejects.toThrow("S3 unavailable");
  });
});

describe("atomic static build output", () => {
  it("restores the active and previous snapshots when generation fails", async () => {
    const root = await temporaryDirectory();
    const outDir = path.join(root, "out");
    const previousDir = path.join(root, ".content-snapshot-previous");
    await mkdir(outDir);
    await mkdir(previousDir);
    await writeFile(path.join(outDir, "index.html"), "active-good");
    await writeFile(path.join(previousDir, "index.html"), "older-good");

    await expect(runAtomicStaticBuild({
      outDir,
      previousDir,
      runBuild: async () => {
        await mkdir(outDir);
        await writeFile(path.join(outDir, "index.html"), "partial-new-build");
      },
      runSnapshot: async () => { throw new Error("S3 unavailable"); },
    })).rejects.toThrow("S3 unavailable");

    expect(await readFile(path.join(outDir, "index.html"), "utf8")).toBe("active-good");
    expect(await readFile(path.join(previousDir, "index.html"), "utf8")).toBe("older-good");
  });

  it("promotes only a complete snapshot and retains the former active output as rollback", async () => {
    const root = await temporaryDirectory();
    const outDir = path.join(root, "out");
    const previousDir = path.join(root, ".content-snapshot-previous");
    await mkdir(outDir);
    await mkdir(previousDir);
    await writeFile(path.join(outDir, "index.html"), "active-good");
    await writeFile(path.join(previousDir, "index.html"), "older-good");

    await runAtomicStaticBuild({
      outDir,
      previousDir,
      runBuild: async () => {
        await mkdir(outDir);
        await writeFile(path.join(outDir, "index.html"), "new-good");
      },
      runSnapshot: async () => ({ revision, mediaCount: 1 }),
    });

    expect(await readFile(path.join(outDir, "index.html"), "utf8")).toBe("new-good");
    expect(await readFile(path.join(previousDir, "index.html"), "utf8")).toBe("active-good");
  });
});
