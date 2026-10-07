import fs from "node:fs";
import { describe, expect, it } from "vitest";

describe("remote admin client errors", () => {
  it("does not treat a failed fetch as missing S3", () => {
    const source = fs.readFileSync(new URL("./localStore.ts", import.meta.url), "utf8");
    const request = source.slice(source.indexOf("const request = async"), source.indexOf("const call ="));
    expect(request).toContain('throw new AdminClientError("network")');
    expect(request).not.toContain('throw new AdminClientError("storage_unavailable")');
  });

  it("sends the last loaded saved draft with remote saves", () => {
    const source = fs.readFileSync(new URL("./localStore.ts", import.meta.url), "utf8");
    expect(source).toContain("savedDraftByEntity");
    expect(source).toContain("outgoingArgs.push(savedDraftByEntity.get(entityKey))");
    expect(source).toContain("savedDraftByEntity.set(key, cloneDraft(record.savedDraft))");
  });
});
