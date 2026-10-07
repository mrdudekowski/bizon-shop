import { describe, expect, it } from "vitest";
import { mediaReplacementsMigration } from "./0006-media-replacements";

describe("media replacements migration", () => {
  it("stores one pending replacement per existing media identity", () => {
    expect(mediaReplacementsMigration.version).toBe("202610060006");
    expect(mediaReplacementsMigration.sql).toContain("CREATE TABLE IF NOT EXISTS cms_media_replacements");
    expect(mediaReplacementsMigration.sql).toContain("target_media_id bigint PRIMARY KEY REFERENCES media(id)");
    expect(mediaReplacementsMigration.sql).toContain("staged_media_id bigint NOT NULL UNIQUE REFERENCES media(id)");
  });
});
