import fs from "node:fs";
import { describe, expect, it } from "vitest";

describe("createAsset storage", () => {
  it("does not slice data URLs into media.url", () => {
    const source = fs.readFileSync(new URL("./postgresAdmin.ts", import.meta.url), "utf8");
    const start = source.indexOf("async createAsset");
    const end = source.indexOf("async listAssets", start);
    const block = source.slice(start, end);
    expect(block).not.toContain("slice(0, 500)");
    expect(block).toContain("putMedia");
  });

  it("does not dispatch createAsset over JSON RPC", () => {
    const source = fs.readFileSync(new URL("../../adminDispatch.ts", import.meta.url), "utf8");
    expect(source).toContain('method === "createAsset"');
  });
});
