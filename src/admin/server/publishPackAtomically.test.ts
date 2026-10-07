import { describe, expect, it } from "vitest";

import { getTransactionClient } from "../../databaseTransaction";
import { publishPackAtomically } from "./publishPackAtomically";

function transactionalPool() {
  let committed = { entries: ["old"], status: "pending_review" };
  let working: typeof committed | null = null;
  let failAt: string | null = "two";
  const events: string[] = [];
  const client = {
    async query(sql: string) {
      events.push(sql);
      if (sql === "BEGIN") working = { entries: [...committed.entries], status: committed.status };
      else if (sql === "COMMIT") {
        if (working == null) throw new Error("transaction was not started");
        committed = working;
        working = null;
      } else if (sql === "ROLLBACK") working = null;
      else if (sql.startsWith("PUBLISH:")) {
        if (working == null) throw new Error("write outside transaction");
        const entry = sql.slice("PUBLISH:".length);
        if (entry === failAt) throw new Error("injected write failure");
        working.entries.push(entry);
      } else if (sql === "STATUS:published") {
        if (working == null) throw new Error("status write outside transaction");
        working.status = "published";
      }
      return { rows: [] };
    },
    release() {},
  };
  return {
    events,
    client,
    connect: async () => client,
    snapshot: () => ({ entries: [...committed.entries], status: committed.status }),
    stopFailing: () => { failAt = null; },
  };
}

describe("publishPackAtomically", () => {
  it("rolls back earlier entries and leaves the pack retryable after a mid-pack failure", async () => {
    const pool = transactionalPool();

    await expect(
      publishPackAtomically(
        pool as never,
        ["one", "two"],
        async (entry) => { await getTransactionClient()?.query(`PUBLISH:${entry}`); },
        async () => { await getTransactionClient()?.query("STATUS:published"); },
      ),
    ).rejects.toThrow("injected write failure");

    expect(pool.snapshot()).toEqual({ entries: ["old"], status: "pending_review" });
    expect(pool.events).toEqual(["BEGIN", "PUBLISH:one", "PUBLISH:two", "ROLLBACK"]);
    pool.stopFailing();

    await publishPackAtomically(
      pool as never,
      ["one", "two"],
      async (entry) => { await getTransactionClient()?.query(`PUBLISH:${entry}`); },
      async () => { await getTransactionClient()?.query("STATUS:published"); },
    );

    expect(pool.snapshot()).toEqual({ entries: ["old", "one", "two"], status: "published" });
    expect(pool.events.slice(-5)).toEqual(["BEGIN", "PUBLISH:one", "PUBLISH:two", "STATUS:published", "COMMIT"]);
    expect(pool.events.at(-1)).toBe("COMMIT");
  });
});
