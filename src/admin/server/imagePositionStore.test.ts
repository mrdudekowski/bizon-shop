import { describe, expect, it } from "vitest";
import { replaceStoredImagePositions } from "./imagePositionStore";

describe("stored CMS image positions", () => {
  it("replaces one entity's positions with per-path media coordinates", async () => {
    const calls: { sql: string; params?: unknown[] }[] = [];
    await replaceStoredImagePositions(async (sql, params) => { calls.push({ sql, params }); }, "pages", "branding", [
      { path: "hero.image", assetId: "42", focalX: 0.15, focalY: 0.75 },
    ]);
    expect(calls).toHaveLength(2);
    expect(calls[0].sql).toContain("DELETE FROM cms_image_focal_positions");
    expect(calls[1].params).toEqual(["pages", "branding", "hero.image", 42, 0.15, 0.75]);
  });
});
