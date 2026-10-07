import type { Migration } from "../migrationRunner";

export const mediaDeletionHistoryMigration: Migration = {
  version: "202610060005",
  description: "Record CMS media deletions for administrators",
  sql: `
    CREATE TABLE IF NOT EXISTS cms_media_deletion_history (
      id bigserial PRIMARY KEY,
      media_id text NOT NULL,
      filename text NOT NULL,
      mime_type text NOT NULL DEFAULT '',
      object_key text NOT NULL,
      deleted_by_user_id text NOT NULL,
      deleted_by_login text NOT NULL,
      deleted_at timestamptz NOT NULL DEFAULT now()
    );
    CREATE INDEX IF NOT EXISTS cms_media_deletion_history_deleted_at_idx
      ON cms_media_deletion_history (deleted_at DESC, id DESC);
  `,
};
