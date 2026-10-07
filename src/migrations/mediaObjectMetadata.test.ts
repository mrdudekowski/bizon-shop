import { describe, expect, it } from "vitest";
import { mediaObjectMetadataMigration } from "./0004-media-object-metadata";

describe("media object metadata migration", () => {
  it("adds nullable metadata for existing assets and a cleanup retry queue", () => {
    expect(mediaObjectMetadataMigration.version).toBe("202610030004");
    expect(mediaObjectMetadataMigration.sql).toContain("ADD COLUMN IF NOT EXISTS object_key text");
    expect(mediaObjectMetadataMigration.sql).toContain("ADD COLUMN IF NOT EXISTS sha256 char(64)");
    expect(mediaObjectMetadataMigration.sql).toContain("CREATE TABLE IF NOT EXISTS cms_media_cleanup");
  });
});
