import { describe, expect, it } from "vitest";
import { publishedContentFailureDetails } from "./contentRevision";

describe("published content failure diagnostics", () => {
  it("keeps only a safe error class and SQLSTATE code", () => {
    const error = Object.assign(new Error("query leaked secret value"), { code: "42703" });
    expect(publishedContentFailureDetails(error)).toEqual({ errorClass: "Error", databaseCode: "42703" });
    expect(JSON.stringify(publishedContentFailureDetails(error))).not.toContain("secret");
  });

  it("bounds unexpected error metadata", () => {
    const error = Object.assign(new Error("sensitive details"), { name: "oops\nforged-log", code: "ECONNREFUSED" });
    expect(publishedContentFailureDetails(error)).toEqual({ errorClass: "unknown" });
  });
});
