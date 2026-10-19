import { describe, expect, it, vi } from "vitest";
import { retryQueuedMediaCleanup } from "./mediaCleanup";

describe("media cleanup queue", () => {
  it("deletes stored objects and keeps failed keys queued for a later retry", async () => {
    const calls: [string, unknown[]][] = [];
    const query = async (sql: string, params: unknown[] = []) => {
      calls.push([sql, params]);
      if (sql.startsWith("SELECT object_key")) return [
        { object_key: "bizon/media/removed.jpg" },
        { object_key: "bizon/media/retry.jpg" },
      ];
      return [];
    };
    const store = {
      delete: vi.fn(async ({ key }: { key: string }) => {
        if (key.endsWith("retry.jpg")) throw new Error("temporary S3 failure");
      }),
    };

    await retryQueuedMediaCleanup(query, store);

    expect(store.delete).toHaveBeenCalledTimes(2);
    expect(calls).toContainEqual(["DELETE FROM cms_media_cleanup WHERE object_key = $1", ["bizon/media/removed.jpg"]]);
    expect(calls).toContainEqual([
      "UPDATE cms_media_cleanup SET attempts = attempts + 1, last_attempt_at = now() WHERE object_key = $1",
      ["bizon/media/retry.jpg"],
    ]);
  });

  it("spaces retries and selects failed rows fairly", async () => {
    let selection = "";
    const query = async (sql: string) => { selection = sql; return []; };
    await retryQueuedMediaCleanup(query, { delete: vi.fn() });
    expect(selection).toContain("last_attempt_at < now() - interval '5 minutes'");
    expect(selection).toContain("ORDER BY last_attempt_at ASC NULLS FIRST, created_at ASC");
  });
});
