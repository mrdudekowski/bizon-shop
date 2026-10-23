import { describe, expect, it } from "vitest";
import { shopVariantMediaMigration } from "./0011-shop-variant-media";

describe("Shop variant media migration", () => {
  it("adds one media relation per variant and removes relations with their owner", () => {
    expect(shopVariantMediaMigration.version).toBe("202610220011");
    expect(shopVariantMediaMigration.sql).toContain("REFERENCES products_variants(id) ON DELETE CASCADE");
    expect(shopVariantMediaMigration.sql).toContain("REFERENCES media(id) ON DELETE CASCADE");
    expect(shopVariantMediaMigration.sql).toContain("UNIQUE (parent_id, path)");
    expect(shopVariantMediaMigration.sql).toContain("products_variants_rels_media_id_idx");
    expect(shopVariantMediaMigration.sql).toContain("focal_x double precision NOT NULL DEFAULT 0.5");
    expect(shopVariantMediaMigration.sql).toContain("crop_width double precision NOT NULL DEFAULT 1");
  });
});
