import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";

import { preserveCmsMediaBuildOutput } from "../../../scripts/e2e/cms-media/outputBackup";

const temporaryDirectories: string[] = [];

async function createRoot() {
  const root = await mkdtemp(path.join(os.tmpdir(), "bizon-cms-output-backup-"));
  temporaryDirectories.push(root);
  return root;
}

afterEach(async () => {
  await Promise.all(temporaryDirectories.splice(0).map((directory) => rm(directory, { recursive: true, force: true })));
});

describe("preserveCmsMediaBuildOutput", () => {
  it("restores the previous public export and content snapshot after an E2E build", async () => {
    const root = await createRoot();
    await mkdir(path.join(root, "out"), { recursive: true });
    await mkdir(path.join(root, ".content-snapshot-previous"), { recursive: true });
    await writeFile(path.join(root, "out", "index.html"), "canonical local site");
    await writeFile(path.join(root, ".content-snapshot-previous", "content-snapshot.json"), "canonical previous snapshot");

    const restore = await preserveCmsMediaBuildOutput(root);
    await rm(path.join(root, "out"), { recursive: true, force: true });
    await mkdir(path.join(root, "out"), { recursive: true });
    await writeFile(path.join(root, "out", "index.html"), "E2E database site");
    await rm(path.join(root, ".content-snapshot-previous"), { recursive: true, force: true });

    await restore();

    await expect(readFile(path.join(root, "out", "index.html"), "utf8")).resolves.toBe("canonical local site");
    await expect(readFile(path.join(root, ".content-snapshot-previous", "content-snapshot.json"), "utf8")).resolves.toBe("canonical previous snapshot");
  });

  it("removes the E2E export when there was no local export to preserve", async () => {
    const root = await createRoot();
    const restore = await preserveCmsMediaBuildOutput(root);
    await mkdir(path.join(root, "out"), { recursive: true });
    await writeFile(path.join(root, "out", "index.html"), "E2E database site");

    await restore();

    await expect(readFile(path.join(root, "out", "index.html"), "utf8")).rejects.toMatchObject({ code: "ENOENT" });
  });
});
