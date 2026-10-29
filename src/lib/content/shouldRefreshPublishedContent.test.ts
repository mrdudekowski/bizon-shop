import { describe, expect, it } from "vitest";
import { shouldRefreshPublishedContent } from "./shouldRefreshPublishedContent";

const built = { schema: 1, revision: `sha256:${"a".repeat(64)}` };
const newer = { schema: 1, revision: `sha256:${"b".repeat(64)}` };

describe("shouldRefreshPublishedContent", () => {
  it("stays quiet when the build matches the API", () => {
    expect(shouldRefreshPublishedContent(built, { ...built })).toBe(false);
  });

  it("refreshes when the hashes differ", () => {
    expect(shouldRefreshPublishedContent(built, newer)).toBe(true);
  });

  it("keeps the HTML when either side is missing or malformed", () => {
    expect(shouldRefreshPublishedContent(null, newer)).toBe(false);
    expect(shouldRefreshPublishedContent(built, null)).toBe(false);
    expect(shouldRefreshPublishedContent(built, { schema: 1, revision: "nope" })).toBe(false);
  });
});
