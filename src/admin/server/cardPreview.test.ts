import fs from "node:fs";
import { describe, expect, it } from "vitest";
import { unlinkStoredMediaReferences } from "../../storage/mediaReferences";

const source = fs.readFileSync(new URL("./postgresAdmin.ts", import.meta.url), "utf8");

describe("deleteAsset", () => {
  it("clears every supported published media reference and gallery relation", async () => {
    const statements: string[] = [];
    await unlinkStoredMediaReferences(async (sql) => {
      statements.push(sql);
      return [];
    }, "42");

    for (const statement of [
      "UPDATE tire_types SET cover_image_id = NULL WHERE cover_image_id = $1",
      "UPDATE tire_models SET main_image_id = NULL WHERE main_image_id = $1",
      "UPDATE wheel_types SET cover_image_id = NULL WHERE cover_image_id = $1",
      "UPDATE wheel_models SET main_image_id = NULL WHERE main_image_id = $1",
      "UPDATE shop_categories SET cover_image_id = NULL WHERE cover_image_id = $1",
      "UPDATE shop_category_carousel SET image_id = NULL WHERE image_id = $1",
      "UPDATE products SET main_image_id = NULL WHERE main_image_id = $1",
      "UPDATE tire_iq_articles SET featured_image_id = NULL WHERE featured_image_id = $1",
      "UPDATE pages_shop_catalog_tiles SET icon_media_id = NULL WHERE icon_media_id = $1",
      "UPDATE pages_shop_catalog_tiles SET image_media_id = NULL WHERE image_media_id = $1",
      "UPDATE pages_shop_catalog_tiles SET carousel_image_media_id = NULL WHERE carousel_image_media_id = $1",
      "DELETE FROM tire_models_rels WHERE media_id = $1",
      "DELETE FROM wheel_models_rels WHERE media_id = $1",
      "DELETE FROM products_rels WHERE media_id = $1",
    ]) expect(statements).toContain(statement);
  });
});

describe("card preview", () => {
  it("lists imageAssetId for wheels, shop products, and materials", () => {
    const wheels = source.slice(source.indexOf("async listWheelModels"), source.indexOf("async createWheelModel"));
    const products = source.slice(source.indexOf("async listShopProducts"), source.indexOf("async createShopProduct"));
    const materials = source.slice(source.indexOf("async listMaterials"), source.indexOf("async getMaterial"));
    expect(wheels).toContain("imageAssetId");
    expect(products).toContain("imageAssetId");
    expect(materials).toContain("imageAssetId");
  });
});
