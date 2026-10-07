import fs from "node:fs";
import { describe, expect, it } from "vitest";

const source = fs.readFileSync(new URL("./postgresAdmin.ts", import.meta.url), "utf8");

describe("deleteAsset", () => {
  it("checks published image foreign keys before delete", () => {
    const start = source.indexOf("async deleteAsset");
    const block = source.slice(start, source.indexOf("async listWheelTypes", start));
    expect(block).toContain("tire_types.cover_image_id");
    expect(block).toContain("shop_categories");
    expect(block).toContain("products");
    expect(block).toContain("pages");
    expect(block).toContain("tire_iq_articles");
    expect(block).not.toContain("people_stories");
    expect(block).toContain("tire_models_rels");
    expect(block).toContain("object_key");
    expect(block).toContain("getObjectStore().delete");
    expect(block).toContain("cms_drafts");
    expect(block).toContain("cms_change_sets");
    expect(block).toContain("FOR UPDATE");
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
