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
    expect(source).toContain("thumbAdd");
    expect(source).toContain("Добавить фото");
  });

  it("fits a site-proportion card and drops crop numbers", () => {
    const source = fs.readFileSync(new URL("./PlacementFields.tsx", import.meta.url), "utf8");
    const css = fs.readFileSync(new URL("./PlacementFields.module.css", import.meta.url), "utf8");
    expect(source).toContain("fitCmsPreviewToViewport");
    expect(source).toContain("setPointerCapture");
    expect(source).not.toContain("patchCrop");
    expect(source).not.toContain("Точная настройка кадрирования");
    expect(css).toContain("var(--cms-preview-max, 22rem)");
    expect(css).toContain("aspect-ratio: 1 / 1");
    expect(css).toContain("object-fit: cover");
    expect(css).toContain("object-position: var(--focus-x, 50%) var(--focus-y, 50%)");
  });
});
