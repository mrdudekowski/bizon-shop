import { describe, expect, it } from "vitest";

import { assertDraftVersion } from "./draftConcurrency";

describe("assertDraftVersion", () => {
  it("allows a save when the editor's saved snapshot still matches", () => {
    expect(() => assertDraftVersion({ name: "LH01" }, { name: "LH01" })).not.toThrow();
  });

  it("rejects a save when another session changed the saved draft", () => {
    expect(() => assertDraftVersion({ name: "LH01" }, { name: "LH01 new" })).toThrowError(
      expect.objectContaining({ code: "conflict" }),
    );
  });

  it("rejects a save when the caller did not load a baseline", () => {
    expect(() => assertDraftVersion(undefined, { name: "LH01" })).toThrowError(
      expect.objectContaining({ code: "conflict" }),
    );
  });

  it("accepts an explicit empty baseline for a new draft", () => {
    expect(() => assertDraftVersion(null, null)).not.toThrow();
  });
});
