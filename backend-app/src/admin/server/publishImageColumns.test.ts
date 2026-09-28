import fs from "node:fs";
import { describe, expect, it } from "vitest";

describe("publish image columns", () => {
  it("publishMaterial writes featured_image_id", () => {
    const source = fs.readFileSync(new URL("./postgresAdmin.ts", import.meta.url), "utf8");
    const start = source.indexOf("async publishMaterial");
    const block = source.slice(start, source.indexOf("async hideMaterial", start));
    expect(block).toContain("featured_image_id");
  });

  it("writePage home includes shop campaign image", () => {
    const source = fs.readFileSync(new URL("./postgresAdmin.ts", import.meta.url), "utf8");
    const start = source.indexOf("async function writePage");
    const block = source.slice(start, start + 2500);
    expect(block).toContain("home_shop_campaign_image_id");
    expect(block).toContain("shop_hero_image_id");
  });
});
