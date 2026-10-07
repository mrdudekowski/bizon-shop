import { describe, expect, it } from "vitest";
import { mediaDeletionHistoryMigration } from "./0005-media-deletion-history";

describe("media deletion history migration", () => {
  it("stores the deleted file, actor and deletion time without depending on the deleted media row", () => {
    expect(mediaDeletionHistoryMigration.version).toBe("202610060005");
    expect(mediaDeletionHistoryMigration.sql).toContain("CREATE TABLE IF NOT EXISTS cms_media_deletion_history");
    expect(mediaDeletionHistoryMigration.sql).toContain("media_id text NOT NULL");
    expect(mediaDeletionHistoryMigration.sql).toContain("deleted_by_user_id text NOT NULL");
    expect(mediaDeletionHistoryMigration.sql).toContain("deleted_by_login text NOT NULL");
    expect(mediaDeletionHistoryMigration.sql).toContain("deleted_at timestamptz NOT NULL DEFAULT now()");
  });
});
