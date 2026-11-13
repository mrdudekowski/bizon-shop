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
    expect(calls[1].params).toEqual(["pages", "branding", "hero.image", 42, 0.15, 0.75, null]);
  });

  it("stores the viewport map and mirrors its desktop point into the legacy columns", async () => {
    const calls: { sql: string; params?: unknown[] }[] = [];
    const positions = [{
      path: "hero.image",
      assetId: "42",
      focalX: 0.15,
      focalY: 0.75,
      focalByViewport: {
        desktop: { x: 0.2, y: 0.8 },
        tablet: { x: 0.7, y: 0.3 },
        mobile: { x: 0.4, y: 0.6 },
      },
    }];
    await replaceStoredImagePositions(async (sql, params) => { calls.push({ sql, params }); }, "pages", "home", positions);

    expect(calls[1].sql).toContain("focal_by_viewport");
    expect(calls[1].params).toEqual([
      "pages", "home", "hero.image", 42, 0.2, 0.8,
      { desktop: { x: 0.2, y: 0.8 }, tablet: { x: 0.7, y: 0.3 }, mobile: { x: 0.4, y: 0.6 } },
    ]);
  });

  it("replaces rows with the same final set when publication repeats", async () => {
    const calls: { sql: string; params?: unknown[] }[] = [];
    const query = async (sql: string, params?: unknown[]) => { calls.push({ sql, params }); };
    const positions = [{ path: "hero.image", assetId: "42", focalX: 0.2, focalY: 0.8 }];
    await replaceStoredImagePositions(query, "pages", "home", positions);
    const firstWrite = calls.slice(1);
    calls.length = 0;
    await replaceStoredImagePositions(query, "pages", "home", positions);

    expect(calls.slice(1)).toEqual(firstWrite);
  });
});
