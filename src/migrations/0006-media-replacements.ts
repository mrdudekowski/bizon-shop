import type { Migration } from "../migrationRunner";

export const mediaReplacementsMigration: Migration = {
  version: "202610060006",
  description: "Stage media replacements until normal content publication",
  sql: `
    CREATE TABLE IF NOT EXISTS cms_media_replacements (
      target_media_id bigint PRIMARY KEY REFERENCES media(id) ON DELETE CASCADE,
      staged_media_id bigint NOT NULL UNIQUE REFERENCES media(id) ON DELETE CASCADE,
      created_at timestamptz NOT NULL DEFAULT now()
    );
  `,
};
