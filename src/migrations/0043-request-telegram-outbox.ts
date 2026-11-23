import type { Migration } from "../migrationRunner";

export const requestTelegramOutboxMigration: Migration = {
  version: "202611230003",
  description: "Add durable request Telegram notification outbox",
  sql: `
    CREATE TABLE IF NOT EXISTS request_telegram_notifications (
      id bigserial PRIMARY KEY,
      request_id integer NOT NULL UNIQUE REFERENCES requests(id) ON DELETE CASCADE,
      status text NOT NULL DEFAULT 'queued'
        CHECK (status IN ('queued', 'processing', 'retry_wait', 'accepted_by_telegram', 'failed_final')),
      attempt_count integer NOT NULL DEFAULT 0 CHECK (attempt_count >= 0),
      manual_retry_count integer NOT NULL DEFAULT 0 CHECK (manual_retry_count >= 0),
      last_manual_retry_at timestamptz,
      last_manual_retry_by text,
      next_attempt_at timestamptz NOT NULL DEFAULT now(),
      locked_until timestamptz,
      next_part_index integer NOT NULL DEFAULT 0 CHECK (next_part_index >= 0),
      telegram_message_ids jsonb NOT NULL DEFAULT '[]'::jsonb
        CHECK (jsonb_typeof(telegram_message_ids) = 'array'),
      accepted_at timestamptz,
      last_error_code text,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    );

    CREATE INDEX IF NOT EXISTS request_telegram_notifications_due_idx
      ON request_telegram_notifications (next_attempt_at, id)
      WHERE status IN ('queued', 'retry_wait');
    CREATE INDEX IF NOT EXISTS request_telegram_notifications_lease_idx
      ON request_telegram_notifications (locked_until)
      WHERE status = 'processing';
  `,
};
