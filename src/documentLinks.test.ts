import { describe, expect, it } from "vitest";
import { mapAdminDocumentLinks, mapPublishedDocuments } from "./documentLinks";

describe("CMS document link mapping", () => {
  it("maps ordered persisted media IDs back to CMS asset links", () => {
    expect(mapAdminDocumentLinks([
      { media_id: 41, title: "Паспорт" },
      { media_id: null, title: "invalid" },
    ])).toEqual([{ assetId: "41", title: "Паспорт" }]);
  });

  it("maps only documents with a public URL to the public contract", () => {
    expect(mapPublishedDocuments([
      { url: "https://cdn.example.test/passport.pdf", title: "Паспорт" },
      { url: "", title: "missing" },
    ])).toEqual([{ url: "https://cdn.example.test/passport.pdf", title: "Паспорт" }]);
  });
});
