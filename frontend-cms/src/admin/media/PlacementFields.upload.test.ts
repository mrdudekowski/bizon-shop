import fs from "node:fs";
import { describe, expect, it } from "vitest";

describe("PlacementFields upload", () => {
  it("does not read the file as a data URL", () => {
    const source = fs.readFileSync(new URL("./PlacementFields.tsx", import.meta.url), "utf8");
    expect(source).not.toContain("readAsDataURL");
    expect(source).toContain("createAsset");
    expect(source).toContain("export function ProductPhotoFields");
    expect(source).toContain("multiple");
    expect(source).not.toContain("width={960}");
  });

  it("uses marketplace thumbs for cover and gallery", () => {
    const source = fs.readFileSync(new URL("./PlacementFields.tsx", import.meta.url), "utf8");
    expect(source).toContain("hovered ?? pinned");
    expect(source).toContain("onMouseLeave");
    expect(source).toContain("onCoverChange");
  });

  it("fits editor previews inside the viewport", () => {
    const source = fs.readFileSync(new URL("./PlacementFields.tsx", import.meta.url), "utf8");
    const css = fs.readFileSync(new URL("./PlacementFields.module.css", import.meta.url), "utf8");
    expect(source).toContain("fitCmsPreviewToViewport");
    expect(css).toContain("var(--cms-preview-max)");
    expect(css).toContain("object-fit: contain");
    expect(css).not.toContain("overflow: hidden");
  });
});
