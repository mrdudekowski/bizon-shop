import { describe, expect, it } from "vitest";

describe("publishedClient", () => {
  it("treats the baked snapshot as available without CONTENT_API_URL", async () => {
    const { publishedApiEnabled } = await import("./publishedClient");
    expect(publishedApiEnabled()).toBe(true);
  });

  it("returns the captured tire type list", async () => {
    const { fetchPublishedJson } = await import("./publishedClient");
    const types = await fetchPublishedJson<{ slug: string }[]>("/v1/tires/types");
    expect(types?.map((type) => type.slug)).toContain("tbr");
  });

  it("returns null for a route that was not published", async () => {
    const { fetchPublishedJson } = await import("./publishedClient");
    await expect(fetchPublishedJson("/v1/tires/types/missing")).resolves.toBeNull();
  });
});
