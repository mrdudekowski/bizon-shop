import { describe, expect, it, vi } from "vitest";

import { afterTransactionCommit, getTransactionClient, withTransaction } from "./databaseTransaction";

function fakePool() {
  const events: string[] = [];
  const client = {
    query: vi.fn(async (sql: string) => {
      events.push(sql);
      return { rows: [] };
    }),
    release: vi.fn(),
  };
  return { events, client, connect: vi.fn(async () => client) };
}

describe("withTransaction", () => {
  it("commits all work on one client and reuses it for nested work", async () => {
    const pool = fakePool();

    await withTransaction(pool as never, async (client) => {
      expect(getTransactionClient()).toBe(client);
      await withTransaction(pool as never, async (nested) => {
        expect(nested).toBe(client);
        await nested.query("UPDATE content");
      });
    });

    expect(pool.events).toEqual(["BEGIN", "UPDATE content", "COMMIT"]);
    expect(pool.connect).toHaveBeenCalledTimes(1);
    expect(pool.client.release).toHaveBeenCalledTimes(1);
  });

  it("rolls back failed work and releases its client", async () => {
    const pool = fakePool();
    const failure = new Error("publish failed");

    await expect(
      withTransaction(pool as never, async () => {
        throw failure;
      }),
    ).rejects.toBe(failure);

    expect(pool.events).toEqual(["BEGIN", "ROLLBACK"]);
    expect(pool.client.release).toHaveBeenCalledTimes(1);
  });

  it("serializes concurrent queries made inside one transaction", async () => {
    const pool = fakePool();
    let activeQueries = 0;
    let concurrentQueryDetected = false;
    pool.client.query.mockImplementation(async (sql: string) => {
      activeQueries += 1;
      if (activeQueries > 1) concurrentQueryDetected = true;
      await new Promise((resolve) => setTimeout(resolve, 2));
      activeQueries -= 1;
      return { rows: [], command: sql } as never;
    });

    await withTransaction(pool as never, async (client) => {
      await Promise.all([client.query("SELECT 1"), client.query("SELECT 2")]);
    });

    expect(concurrentQueryDetected).toBe(false);
  });

  it("runs external cleanup only after the database commit", async () => {
    const pool = fakePool();
    const events: string[] = [];
    pool.client.query.mockImplementation(async (sql: string) => {
      events.push(sql);
      return { rows: [] };
    });

    await withTransaction(pool as never, async () => {
      afterTransactionCommit(async () => {
        events.push("DELETE OBJECT");
      });
      events.push("SAVE DELETE HISTORY");
    });

    expect(events).toEqual(["BEGIN", "SAVE DELETE HISTORY", "COMMIT", "DELETE OBJECT"]);
  });
});
