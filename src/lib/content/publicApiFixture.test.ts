import { describe, expect, it } from "vitest";

import { responseForPublicApiPath } from "../../../scripts/ciPublicApiFixture.js";

describe("public runtime API fixture", () => {
  it("returns valid representative records for dynamic public routes", () => {
    expect(responseForPublicApiPath("/v1/tires/types").body).toHaveLength(1);
    expect(responseForPublicApiPath("/v1/shop/products").body[0].variants).toHaveLength(1);
    expect(responseForPublicApiPath("/v1/tires/types/tbr/models").body[0].tireTypeSlug).toBe("tbr");
    expect(responseForPublicApiPath("/v1/articles").body[0].slug).toBe("ci-fixture-article");
  });

  it("returns representative page records for public requests", () => {
    expect(responseForPublicApiPath("/v1/pages/home")).toEqual({ status: 200, body: { hero: {} } });
    expect(responseForPublicApiPath("/v1/pages/about")).toEqual({
      status: 200,
      body: { hero: { title: "CI fixture about" } },
    });
    expect(responseForPublicApiPath("/v1/pages/warranty")).toEqual({
      status: 200,
      body: { hero: { title: "CI fixture warranty" } },
    });
  });

  it("rejects unknown API paths instead of masking route drift", () => {
    expect(responseForPublicApiPath("/v1/unknown")).toEqual({
      status: 404,
      body: { ok: false },
    });
  });
});
