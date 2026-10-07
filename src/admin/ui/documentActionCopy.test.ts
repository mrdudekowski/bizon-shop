import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const editors = [
  "../shop/ShopCategoryEditor.tsx",
  "../shop/ShopProductEditor.tsx",
  "../tires/TireModelEditor.tsx",
  "../tires/TireDirectionEditor.tsx",
  "../wheels/WheelModelEditor.tsx",
  "../wheels/WheelTypeEditor.tsx",
  "../pages/PageEditor.tsx",
  "../materials/MaterialEditor.tsx",
].map((file) => new URL(file, import.meta.url));

describe("document action copy", () => {
  it("marks footer action messages as status or alert", () => {
    const source = fs.readFileSync(new URL("./DocumentReviewFooter.tsx", import.meta.url), "utf8");
    expect(source).toContain("feedbackRole");
    expect(source).toContain("role={feedbackRole(message)}");
  });

  it("announces publish success in every entity editor", () => {
    for (const file of editors) {
      const source = fs.readFileSync(file, "utf8");
      expect(source, path.basename(file.pathname)).toContain("DOCUMENT_STATUS.published");
      expect(source, path.basename(file.pathname)).toContain("actionErrorText");
    }
  });

  it("surfaces PDF upload failures on pages", () => {
    const source = fs.readFileSync(new URL("../pages/PageEditor.tsx", import.meta.url), "utf8");
    expect(source).toContain("uploadErrorText");
    expect(source).toContain("onDocumentFile");
    expect(source).toMatch(/onDocumentFile[\s\S]*catch/);
  });
});
