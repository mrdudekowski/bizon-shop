import { describe, expect, it } from "vitest";

import { responseForBuildApiPath } from "../../../scripts/ciBuildApiFixture.js";

describe("static build API fixture", () => {
  it("returns valid representative records for dynamic public routes", () => {
    expect(responseForBuildApiPath("/v1/tires/types").body).toHaveLength(1);
    expect(responseForBuildApiPath("/v1/shop/products").body[0].variants).toHaveLength(1);
    expect(responseForBuildApiPath("/v1/tires/types/tbr/models").body[0].tireTypeSlug).toBe("tbr");
    expect(responseForBuildApiPath("/v1/articles").body[0].slug).toBe("ci-fixture-article");
  });

  it("returns synthetic stub titles required by the static export contract", () => {
    expect(responseForBuildApiPath("/v1/pages/home")).toEqual({ status: 200, body: { hero: {} } });
    expect(responseForBuildApiPath("/v1/pages/about")).toEqual({
      status: 200,
      body: { hero: { title: "CI fixture about" } },
    });
    expect(responseForBuildApiPath("/v1/pages/warranty")).toEqual({
      status: 200,
      body: { hero: { title: "CI fixture warranty" } },
    });
  });

  it("provides a valid published content revision for the guarded CI export", () => {
    expect(responseForBuildApiPath("/v1/content/revision")).toMatchObject({
      status: 200,
      body: { schema: 1, revision: expect.stringMatching(/^sha256:[a-f0-9]{64}$/) },
    });
  });

  it("provides one coherent fixture snapshot with every publication collection", () => {
    expect(responseForBuildApiPath("/v1/content/snapshot")).toMatchObject({
      status: 200,
      body: {
        schema: 1,
        revision: expect.stringMatching(/^sha256:[a-f0-9]{64}$/),
        content: {
          home: { hero: {} },
          shopHome: { hero: {} },
          articles: [{ slug: "ci-fixture-article" }],
          tires: { types: [{ slug: "tbr" }], models: [{ model: { slug: "ci-fixture-tire" } }] },
          wheels: {
            types: [{ slug: "forged" }],
            byType: [{ models: [{ slug: "ci-fixture-wheel" }, { slug: "ci-fixture-wheel-2" }] }],
          },
          shop: { categories: [{ slug: "accessories" }], products: [{ slug: "ci-fixture-product" }] },
        },
      },
    });
  });

  it("rejects unknown API paths instead of masking route drift", () => {
    expect(responseForBuildApiPath("/v1/unknown")).toEqual({
      status: 404,
      body: { ok: false },
    });
  });
});
