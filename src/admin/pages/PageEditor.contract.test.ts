import fs from "node:fs";
import { describe, expect, it } from "vitest";

const source = fs.readFileSync(new URL("./PageEditor.tsx", import.meta.url), "utf8");
const stubFieldsStart = source.indexOf("function StubFields");
const shopHomeFieldsStart = source.indexOf("function ShopHomeFields");
const pageEditorStart = source.indexOf("export function PageEditor");

describe("PageEditor page-specific fields", () => {
  it("keeps the category carousel editor on the Shop landing page only", () => {
    const stubFields = source.slice(stubFieldsStart, shopHomeFieldsStart);
    const shopHomeFields = source.slice(shopHomeFieldsStart, pageEditorStart);

    expect(stubFields).not.toContain("categoryCarousel");
    expect(shopHomeFields).toContain("categoryCarousel");
  });
});
