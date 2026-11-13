import fs from "node:fs";
import { describe, expect, it } from "vitest";

const source = fs.readFileSync(new URL("./postgresAdmin.ts", import.meta.url), "utf8");

function block(start: string, end: string): string {
  const from = source.indexOf(start);
  const to = source.indexOf(end, from);
  if (from < 0 || to < 0) throw new Error(`Could not find source block: ${start}`);
  return source.slice(from, to);
}

describe("first published_at write", () => {
  it("sets the timestamp once and leaves it unchanged when hiding or unpublishing", () => {
    const sourceBlock = block("async function publishStatus", "export function createPostgresAdminClient");
    expect(sourceBlock).toMatch(/const publishedAt = status === "published" \? "COALESCE\(published_at, now\(\)\)" : "published_at"/);
    expect(sourceBlock).toContain("SET status=$2, published_at=${publishedAt}");
  });

  it.each([
    ["tire direction", "async publishTireDirection", "async hideTireDirection"],
    ["wheel type", "async publishWheelType", "async hideWheelType"],
    ["wheel model and variants", "async publishWheelModel", "async hideWheelModel"],
    ["shop category", "async publishShopCategory", "async hideShopCategory"],
    ["shop product", "async publishShopProduct", "async hideShopProduct"],
    ["article", "async publishMaterial", "async hideMaterial"],
    ["pages", "async function writePage", "export async function catalogPublishGaps"],
    ["tire model and variants", "async function writeTireModel", "async function publishStatus"],
  ])("writes a first-publish timestamp for %s", (_label, start, end) => {
    expect(block(start, end)).toMatch(/published_at\s*=\s*(?:COALESCE\(published_at,\s*now\(\)\)|CASE WHEN[\s\S]*?COALESCE\(published_at,\s*now\(\)\))/i);
  });
});
