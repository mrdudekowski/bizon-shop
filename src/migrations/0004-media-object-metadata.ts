import type { Migration } from "../migrationRunner";

export const mediaObjectMetadataMigration: Migration = {
  version: "202610030004",
  description: "Track canonical object keys and retryable media cleanup",
  sql: `
    ALTER TABLE media
      ADD COLUMN IF NOT EXISTS object_key text,
      ADD COLUMN IF NOT EXISTS declared_mime_type text,
      ADD COLUMN IF NOT EXISTS sha256 char(64);
    CREATE UNIQUE INDEX IF NOT EXISTS media_object_key_unique
      ON media (object_key) WHERE object_key IS NOT NULL;
    CREATE TABLE IF NOT EXISTS cms_media_cleanup (
      object_key text PRIMARY KEY,
      reason text NOT NULL,
      attempts integer NOT NULL DEFAULT 0,
      created_at timestamptz NOT NULL DEFAULT now(),
      last_attempt_at timestamptz
    );
  `,
};
