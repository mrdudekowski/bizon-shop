import { describe, expect, it } from "vitest";
import { isPublishedContentSnapshot, resolvePublishedSnapshotResponse } from "./publishedSnapshot";

const snapshot = {
  schema: 1 as const,
  revision: `sha256:${"a".repeat(64)}`,
  content: {
    home: { hero: { title: "Home" } },
    shopHome: { hero: { title: "Shop" } },
    stubs: { about: { hero: { title: "About" } } },
    articles: [{ slug: "story", title: "Story" }],
    tires: {
      types: [{ slug: "tbr", name: "TBR" }],
      models: [{
        model: { id: "t1", slug: "road", tireTypeSlug: "tbr" },
        variants: [{ id: "tv1" }],
      }],
    },
    wheels: {
      types: [{ slug: "steel" }],
      byType: [{
        models: [{ id: "w1", slug: "forged" }],
        variants: [{ id: "wv1", modelId: "w1" }],
      }],
    },
    shop: {
      categories: [{ slug: "oils" }],
      products: [
        { slug: "a", categorySlug: "oils" },
        { slug: "b", categorySlug: "wheels" },
      ],
    },
  },
};

describe("published snapshot route resolution", () => {
  it("accepts only a revisioned snapshot envelope", () => {
    expect(isPublishedContentSnapshot(snapshot)).toBe(true);
    expect(isPublishedContentSnapshot({ ...snapshot, revision: "latest" })).toBe(false);
  });

  it.each([
    ["/v1/pages/home", { hero: { title: "Home" } }],
    ["/v1/pages/about", { hero: { title: "About" } }],
    ["/v1/articles/story", { slug: "story", title: "Story" }],
    ["/v1/tires/types/tbr/models", [{ id: "t1", slug: "road", tireTypeSlug: "tbr" }]],
    ["/v1/tires/models/t1/variants", [{ id: "tv1" }]],
    ["/v1/wheels/types/steel/models", [{ id: "w1", slug: "forged" }]],
    ["/v1/wheels/models/w1/variants", [{ id: "wv1", modelId: "w1" }]],
    ["/v1/shop/products?category=oils", [{ slug: "a", categorySlug: "oils" }]],
  ])("resolves %s from the same published snapshot", (path, body) => {
    expect(resolvePublishedSnapshotResponse(snapshot, path)).toEqual({ status: 200, body });
  });

  it("preserves 404 behavior for unpublished or missing records", () => {
    expect(resolvePublishedSnapshotResponse(snapshot, "/v1/articles/draft").status).toBe(404);
    expect(resolvePublishedSnapshotResponse(snapshot, "/v1/pages/unknown").status).toBe(404);
  });
});
