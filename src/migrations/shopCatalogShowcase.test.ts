import fs from "node:fs";
import { describe, expect, it } from "vitest";

const indexSource = fs.readFileSync(new URL("./index.ts", import.meta.url), "utf8");
const migrationPath = new URL("./0008-shop-catalog-showcase.ts", import.meta.url);
const migrationSource = fs.readFileSync(migrationPath, "utf8");

describe("Shop catalog showcase migration registration", () => {
  it("registers the page-owned catalog tile migration", () => {
    expect(indexSource).toContain('from "./0008-shop-catalog-showcase"');
    expect(indexSource).toContain("shopCatalogShowcaseMigration");
    expect(fs.existsSync(migrationPath)).toBe(true);
    expect(migrationSource).toContain("carousel_image_media_id");
    expect(migrationSource).toContain("shop_category_carousel");
    expect(migrationSource).toContain("ON CONFLICT (_parent_id, category_id) DO NOTHING");
  });
});
