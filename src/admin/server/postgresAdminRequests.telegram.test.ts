import { afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ query: vi.fn() }));

vi.mock("pg", () => ({
  Pool: class {
    query(...args: unknown[]) {
      return mocks.query(...args);
    }
  },
}));

import { createPostgresAdminClient } from "./postgresAdmin";

afterEach(() => {
  vi.unstubAllEnvs();
  mocks.query.mockReset();
});

function adminClient() {
  vi.stubEnv("DATABASE_URI", "postgres://test.invalid/bizon");
  return createPostgresAdminClient({ id: "1", login: "admin", role: "admin", capabilities: [] });
}

describe("request Telegram admin contract", () => {
  it("maps Telegram delivery independently from CRM and email statuses", async () => {
    const client = adminClient();
    mocks.query.mockImplementation(async (sql: string) => {
      if (sql.includes("SELECT * FROM requests ORDER")) {
        return { rows: [{ id: 21, status: "new", client_type: "company", name: "Анна", phone: "+79000000000", source_form: "contact", created_at: new Date("2026-01-01T00:00:00Z"), updated_at: new Date("2026-01-01T00:00:00Z") }] };
      }
      if (sql.includes("FROM request_email_notifications")) return { rows: [{ request_id: 21, status: "accepted_by_smtp" }] };
      if (sql.includes("FROM request_telegram_notifications")) return { rows: [{ request_id: 21, status: "failed_final" }] };
      return { rows: [] };
    });

    const [request] = await client.listRequests();

    expect(request?.emailNotificationStatus).toBe("accepted_by_smtp");
    expect(request?.telegramNotificationStatus).toBe("failed_final");
    expect(request?.status).toBe("new");
    expect(mocks.query).toHaveBeenCalledWith(
      "SELECT request_id, status FROM request_telegram_notifications WHERE request_id = ANY($1::int[])",
      [[21]],
    );
  });

  it("requeues only a final failure and preserves partial-delivery progress", async () => {
    const client = adminClient();
    mocks.query.mockResolvedValue({ rows: [{ id: 9 }] });

    await expect(client.retryRequestTelegramNotification("21")).resolves.toBeUndefined();

    const [sql, params] = mocks.query.mock.calls[0] as [string, unknown[]];
    expect(sql).toContain("status = 'queued'");
    expect(sql).toContain("manual_retry_count = manual_retry_count + 1");
    expect(sql).toContain("WHERE request_id = $1 AND status = 'failed_final'");
    expect(sql).not.toContain("next_part_index =");
    expect(sql).not.toContain("telegram_message_ids =");
    expect(params).toEqual([21, "admin"]);
  });

  it("returns not-found when the request has no final Telegram failure to retry", async () => {
    const client = adminClient();
    mocks.query.mockResolvedValue({ rows: [] });

    await expect(client.retryRequestTelegramNotification("21")).rejects.toMatchObject({ code: "not_found" });
  });
});
