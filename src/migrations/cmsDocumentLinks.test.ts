import { describe, expect, it } from "vitest";
import { cmsDocumentLinksMigration } from "./0012-cms-document-links";

describe("CMS document links migration", () => {
  it("stores ordered PDF links for supported CMS entity types and removes links with media", () => {
    expect(cmsDocumentLinksMigration.version).toBe("202610220012");
    expect(cmsDocumentLinksMigration.sql).toContain("'page', 'tire-model', 'wheel-model'");
    expect(cmsDocumentLinksMigration.sql).toContain("media_id integer NOT NULL REFERENCES media(id) ON DELETE CASCADE");
    expect(cmsDocumentLinksMigration.sql).toContain("sort_order integer NOT NULL DEFAULT 0");
    expect(cmsDocumentLinksMigration.sql).toContain("cms_document_links_owner_idx");
  });
});
