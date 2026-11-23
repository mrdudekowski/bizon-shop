import type { Migration } from "../migrationRunner";

export const requestEmailOutboxMigration: Migration = {
  version: "202611230001",
  description: "Add durable request email notification outbox",
  sql: `
    CREATE TABLE IF NOT EXISTS request_email_notifications (
      id bigserial PRIMARY KEY,
      request_id integer NOT NULL UNIQUE REFERENCES requests(id) ON DELETE CASCADE,
      status text NOT NULL DEFAULT 'queued'
        CHECK (status IN ('queued', 'processing', 'retry_wait', 'accepted_by_smtp', 'failed_final')),
      attempt_count integer NOT NULL DEFAULT 0 CHECK (attempt_count >= 0),
      manual_retry_count integer NOT NULL DEFAULT 0 CHECK (manual_retry_count >= 0),
      last_manual_retry_at timestamptz,
      last_manual_retry_by text,
      next_attempt_at timestamptz NOT NULL DEFAULT now(),
      locked_until timestamptz,
      accepted_at timestamptz,
      provider_message_id text,
      last_error_code text,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    );

    CREATE INDEX IF NOT EXISTS request_email_notifications_due_idx
      ON request_email_notifications (next_attempt_at, id)
      WHERE status IN ('queued', 'retry_wait');
    CREATE INDEX IF NOT EXISTS request_email_notifications_lease_idx
      ON request_email_notifications (locked_until)
      WHERE status = 'processing';
  `,
};
