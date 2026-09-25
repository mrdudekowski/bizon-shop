import { describe, expect, it } from "vitest";

import { up } from "../../../migrations/20260727_015500_tire_catalog_manager_ux";

describe("tire catalog manager UX migration", () => {
  const upSql = up.toString();

  it("does not overwrite an existing SKU from another variant", () => {
    expect(upSql).toMatch(
      /NOT EXISTS\s*\(\s*SELECT 1\s+FROM "tire_variants" occupied/i,
    );
    expect(upSql).toContain('occupied."id" <> proposed."id"');
    expect(upSql).toMatch(
      /occupied\."sku" IS NOT NULL\s+AND trim\(occupied\."sku"\) <> ''/i,
    );
  });

  it("keeps deterministic suffixes for duplicate empty-SKU variants", () => {
    expect(upSql).toContain('ORDER BY variant."id"');
    expect(upSql).toContain(
      'proposed.base_sku || \'-\' || proposed."ply_rating_pr"::text || \'PR\'',
    );
  });
});
