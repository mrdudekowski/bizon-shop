import fs from "node:fs";
import { describe, expect, it } from "vitest";

describe("page list card images", () => {
  it("resolves media and passes the selected page image to its catalog row", () => {
    const source = fs.readFileSync(new URL("./PageList.tsx", import.meta.url), "utf8");
    expect(source).toContain("client.listAssets()");
    expect(source).toContain("imageUrl={assets.find((asset) => asset.id === previewAssetId(page.draft))?.dataUrl}");
  });
});
