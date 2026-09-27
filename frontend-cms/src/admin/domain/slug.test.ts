import { describe, expect, it } from "vitest";
import { isValidSlug, slugifyTitle } from "./slug";

describe("slugifyTitle", () => {
  it("builds a lowercase ascii slug from a russian-free title", () => {
    expect(slugifyTitle("Bizon Long Haul")).toBe("bizon-long-haul");
  });

  it("rejects an empty slug", () => {
    expect(isValidSlug("")).toBe(false);
    expect(isValidSlug("ok-slug")).toBe(true);
    expect(isValidSlug("Bad Slug")).toBe(false);
  });
});
