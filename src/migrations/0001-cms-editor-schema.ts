import type { Migration } from "../migrationRunner";

export const cmsEditorSchemaMigration: Migration = {
  version: "202610030001",
  description: "CMS authentication sessions, editor change sets, drafts, and capabilities",
  sql: `
    CREATE TABLE IF NOT EXISTS cms_auth_sessions (
      token_hash char(64) PRIMARY KEY,
      user_id bigint NOT NULL,
      expires_at timestamptz NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now()
    );
    CREATE INDEX IF NOT EXISTS cms_auth_sessions_user_expiry_idx
      ON cms_auth_sessions (user_id, expires_at);
    ALTER TABLE users
      ADD COLUMN IF NOT EXISTS cms_capabilities jsonb NOT NULL DEFAULT '[]'::jsonb;
    CREATE TABLE IF NOT EXISTS cms_change_sets (
      id text PRIMARY KEY,
      pack jsonb NOT NULL
    );
    CREATE TABLE IF NOT EXISTS cms_drafts (
      collection text NOT NULL,
      doc_id text NOT NULL,
      draft jsonb NOT NULL,
      PRIMARY KEY (collection, doc_id)
    );
  `,
};
