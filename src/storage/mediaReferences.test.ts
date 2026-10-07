import { describe, expect, it } from "vitest";
import { hasMediaReference } from "./mediaReferences";

describe("CMS media references", () => {
  it("finds nested string and numeric asset ids in drafts and change sets", () => {
    expect(hasMediaReference({ gallery: [{ assetId: "42" }] }, "42")).toBe(true);
    expect(hasMediaReference({ pack: { entries: [{ value: { featuredImageId: 42 } }] } }, "42")).toBe(true);
  });

  it("does not treat unrelated record ids or text as media references", () => {
    expect(hasMediaReference({ id: "42", title: "assetId 42" }, "42")).toBe(false);
  });
});
