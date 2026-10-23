import { access, cp, mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

const OUTPUT_PATHS = ["out", ".content-snapshot-previous"] as const;

export async function preserveCmsMediaBuildOutput(root: string): Promise<() => Promise<void>> {
  const backupRoot = await mkdtemp(path.join(os.tmpdir(), "bizon-cms-media-output-"));
  const states: Array<{ relativePath: (typeof OUTPUT_PATHS)[number]; existed: boolean }> = [];

  try {
    for (const relativePath of OUTPUT_PATHS) {
      const source = path.join(root, relativePath);
      let existed = true;
      try {
        await access(source);
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
        existed = false;
      }
      states.push({ relativePath, existed });
      if (existed) await cp(source, path.join(backupRoot, relativePath), { recursive: true, force: true });
    }
  } catch (error) {
    await rm(backupRoot, { recursive: true, force: true });
    throw error;
  }

  let restored = false;
  return async () => {
    if (restored) return;

    try {
      for (const state of states) {
        const destination = path.join(root, state.relativePath);
        await rm(destination, { recursive: true, force: true });
        if (state.existed) {
          await cp(path.join(backupRoot, state.relativePath), destination, { recursive: true, force: true });
        }
      }
      restored = true;
      await rm(backupRoot, { recursive: true, force: true });
    } catch (error) {
      throw new Error(`Could not restore the pre-E2E public output; backup retained at ${backupRoot}`, { cause: error });
    }
  };
}
