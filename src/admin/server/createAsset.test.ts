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
    expect(block).toContain("stored.key.split(\"/\").pop()");
    expect(block).not.toContain("VALUES ($1, '', $1, $2");
  });

  it("does not dispatch createAsset over JSON RPC", () => {
    const source = fs.readFileSync(new URL("../../adminDispatch.ts", import.meta.url), "utf8");
    expect(source).toContain('method === "createAsset"');
  });

  it("keeps the original title visible while using the unique S3 key as filename", () => {
    const source = fs.readFileSync(new URL("./postgresAdmin.ts", import.meta.url), "utf8");
    const createStart = source.indexOf("async createAsset");
    const listStart = source.indexOf("async listAssets", createStart);
    const deleteStart = source.indexOf("async deleteAsset", listStart);
    const createBlock = source.slice(createStart, listStart);
    const listBlock = source.slice(listStart, deleteStart);
    expect(createBlock).toContain("[stored.name, stored.key.split(\"/\").pop()");
    expect(listBlock).toContain("name: str(row.title || row.filename)");
  });

  it("stages media replacement separately and applies it inside publication", () => {
    const source = fs.readFileSync(new URL("./postgresAdmin.ts", import.meta.url), "utf8");
    expect(source).toContain("async replaceAsset(id, file)");
    expect(source).toContain("cms_media_replacements");
    expect(source).toContain("await applyPendingMediaReplacements(draft)");
    expect(source).toContain("afterTransactionCommit(async () =>");
  });

  it("publishes replacement with its unique stored filename while preserving its display title", () => {
    const source = fs.readFileSync(new URL("./postgresAdmin.ts", import.meta.url), "utf8");
    const start = source.indexOf("async function applyPendingMediaReplacements");
    const end = source.indexOf("function collectionOf", start);
    const block = source.slice(start, end);
    expect(block).toContain("staged.id AS staged_id, staged.title, staged.filename");
    expect(block).toContain("[row.target_id, row.title, row.filename, row.mime_type");
    expect(block).not.toContain("[row.target_id, row.title, row.title");
  });

  it("reports editorial proof placements as media usage", () => {
    const source = fs.readFileSync(new URL("./postgresAdmin.ts", import.meta.url), "utf8");
    const start = source.indexOf("async listAssets()");
    const end = source.indexOf("async deleteAsset", start);
    expect(source.slice(start, end)).toContain("pages WHERE editorial_proof_image_id = ANY($1::int[])");
    expect(source.slice(start, end)).toContain("const usagesByMedia = new Map<string, string[]>()");
  });
});
