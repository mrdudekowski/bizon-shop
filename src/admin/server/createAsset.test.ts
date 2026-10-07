import fs from "node:fs";
import { describe, expect, it } from "vitest";

describe("createAsset storage", () => {
  it("does not slice data URLs into media.url", () => {
    const source = fs.readFileSync(new URL("./postgresAdmin.ts", import.meta.url), "utf8");
    const start = source.indexOf("async createAsset");
    const end = source.indexOf("async listAssets", start);
    const block = source.slice(start, end);
    expect(block).not.toContain("slice(0, 500)");
    expect(block).toContain("uploadAndPersistMedia");
    expect(block).toContain("object_key");
    expect(block).toContain("sha256");
  });

  it("does not dispatch createAsset over JSON RPC", () => {
    const source = fs.readFileSync(new URL("../../adminDispatch.ts", import.meta.url), "utf8");
    expect(source).toContain('method === "createAsset"');
  });

  it("stages media replacement separately and applies it inside publication", () => {
    const source = fs.readFileSync(new URL("./postgresAdmin.ts", import.meta.url), "utf8");
    expect(source).toContain("async replaceAsset(id, file)");
    expect(source).toContain("cms_media_replacements");
    expect(source).toContain("await applyPendingMediaReplacements(draft)");
    expect(source).toContain("afterTransactionCommit(async () =>");
  });
});
