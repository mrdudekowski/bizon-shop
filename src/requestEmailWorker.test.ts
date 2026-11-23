import { describe, expect, it, vi } from "vitest";
import { runRequestEmailWorkerStep } from "./requestEmailWorker";

describe("request email outbox worker", () => {
  it("claims queued work and records SMTP acceptance", async () => {
    const query = vi.fn(async (sql: string) => {
      if (sql.includes("RETURNING n.id")) return [{ id: 3, request_id: 81, attempt_count: 1 }];
      if (sql.includes("SELECT * FROM requests WHERE")) return [{ id: 81, name: "Анна" }];
      if (sql.includes("SELECT * FROM requests_items")) return [];
      return [];
    });
    const sendMail = vi.fn(async () => ({ messageId: "mail-1" }));

    await expect(runRequestEmailWorkerStep(query, { sendMail }, { from: "Bizon <noreply@bizontop.ru>", to: "info@bizontop.ru" }, new Date("2026-01-01T00:00:00Z"))).resolves.toBe(1);

    expect(sendMail).toHaveBeenCalledOnce();
    expect(sendMail.mock.calls[0][0].text).toContain("Анна");
    expect(query.mock.calls.at(-1)?.[0]).toContain("accepted_by_smtp");
    expect(query.mock.calls[0][0]).toContain("LIMIT $2 FOR UPDATE SKIP LOCKED");
  });

  it("schedules transient errors with backoff without losing the row", async () => {
    const query = vi.fn(async (sql: string) => {
      if (sql.includes("RETURNING n.id")) return [{ id: 4, request_id: 82, attempt_count: 2 }];
      if (sql.includes("SELECT * FROM requests WHERE")) return [{ id: 82 }];
      if (sql.includes("SELECT * FROM requests_items")) return [];
      return [];
    });
    const sendMail = vi.fn(async () => { throw Object.assign(new Error("timeout"), { code: "ETIMEDOUT" }); });
    const now = new Date("2026-01-01T00:00:00Z");

    await runRequestEmailWorkerStep(query, { sendMail }, { from: "noreply@bizontop.ru", to: "info@bizontop.ru" }, now);

    const update = query.mock.calls.at(-1)!;
    expect(update[1]?.[1]).toBe("retry_wait");
    expect(update[1]?.[2]).toEqual(new Date(now.getTime() + 60_000));
  });
});
