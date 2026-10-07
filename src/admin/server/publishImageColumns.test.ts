import fs from "node:fs";
import { describe, expect, it } from "vitest";

describe("publish image columns", () => {
  it("publishMaterial writes featured_image_id", () => {
    const source = fs.readFileSync(new URL("./postgresAdmin.ts", import.meta.url), "utf8");
    const start = source.indexOf("async publishMaterial");
    const block = source.slice(start, source.indexOf("async hideMaterial", start));
    expect(block).toContain("featured_image_id");
  });

  it("publishMaterial persists menu visibility and order", () => {
    const source = fs.readFileSync(new URL("./postgresAdmin.ts", import.meta.url), "utf8");
    const start = source.indexOf("async publishMaterial");
    const block = source.slice(start, source.indexOf("async hideMaterial", start));
    expect(block).toContain("show_in_menu=$");
    expect(block).toContain("menu_order=$");
    expect(block).toContain("draft.showInMenu");
    expect(block).toContain("draft.menuOrder");
  });

  it("writePage saves home campaign and shop-home hero images to their own columns", () => {
    const source = fs.readFileSync(new URL("./postgresAdmin.ts", import.meta.url), "utf8");
    const start = source.indexOf("async function writePage");
    const end = source.indexOf("export async function catalogPublishGaps", start);
    const block = source.slice(start, end);
    const homeStart = block.indexOf('if (draft.id === "home")');
    const shopHomeStart = block.indexOf('if (draft.id === "shop-home")');
    const homeBlock = block.slice(homeStart, shopHomeStart);
    const shopHomeBlock = block.slice(shopHomeStart);
    expect(homeBlock).toContain("home_shop_campaign_image_id");
    expect(shopHomeBlock).toContain("shop_hero_image_id");
  });
});
