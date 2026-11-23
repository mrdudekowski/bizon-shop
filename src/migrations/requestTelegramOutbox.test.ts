import { describe, expect, it } from "vitest";
import { MIGRATIONS, CURRENT_SCHEMA_VERSION } from "./index";
import { requestTelegramOutboxMigration } from "./0043-request-telegram-outbox";

describe("request Telegram outbox migration", () => {
  it("adds a durable, request-keyed queue with safe delivery states and progress", () => {
    const sql = requestTelegramOutboxMigration.sql;

    expect(sql).toMatch(/CREATE TABLE IF NOT EXISTS request_telegram_notifications/i);
    expect(sql).toMatch(/request_id integer NOT NULL UNIQUE REFERENCES requests\(id\) ON DELETE CASCADE/i);
    expect(sql).toContain("'queued'");
    expect(sql).toContain("'processing'");
    expect(sql).toContain("'retry_wait'");
    expect(sql).toContain("'accepted_by_telegram'");
    expect(sql).toContain("'failed_final'");
    expect(sql).toContain("manual_retry_count");
    expect(sql).toContain("next_attempt_at");
    expect(sql).toContain("locked_until");
    expect(sql).toContain("next_part_index");
    expect(sql).toContain("telegram_message_ids");
    expect(sql).toContain("accepted_at");
    expect(sql).toContain("last_error_code");
    expect(sql).toContain("request_telegram_notifications_due_idx");
    expect(sql).toContain("request_telegram_notifications_lease_idx");
  });

  it("registers as the current schema version immediately after migration 0042", () => {
    const lastMigration = MIGRATIONS.at(-1);
    const precedingMigration = MIGRATIONS.at(-2);

    expect(requestTelegramOutboxMigration.version).toBe("202611230003");
    expect(MIGRATIONS).toContain(requestTelegramOutboxMigration);
    expect(lastMigration).toBe(requestTelegramOutboxMigration);
    expect(precedingMigration?.version).toBe("202611230002");
    expect(CURRENT_SCHEMA_VERSION).toBe(requestTelegramOutboxMigration.version);
  });
});
