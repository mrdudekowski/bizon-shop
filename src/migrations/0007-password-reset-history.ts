import type { Migration } from "../migrationRunner";

export const passwordResetHistoryMigration: Migration = {
  version: "202610060007",
  description: "Record administrator password resets",
  sql: `
    CREATE TABLE IF NOT EXISTS cms_password_reset_history (
      id bigserial PRIMARY KEY,
      actor_user_id bigint NOT NULL,
      actor_login text NOT NULL,
      target_user_id bigint NOT NULL,
      target_login text NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now()
    );
    CREATE INDEX IF NOT EXISTS cms_password_reset_history_created_idx
      ON cms_password_reset_history (created_at DESC, id DESC);
  `,
};
