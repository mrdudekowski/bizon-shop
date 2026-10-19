type CleanupRow = Record<string, unknown>;
export type MediaCleanupQuery = (text: string, params?: unknown[]) => Promise<CleanupRow[]>;
export type MediaCleanupStore = { delete(input: { key: string }): Promise<void> };

export async function retryQueuedMediaCleanup(query: MediaCleanupQuery, store: MediaCleanupStore): Promise<void> {
  const pending = await query(
    `SELECT object_key FROM cms_media_cleanup
     WHERE last_attempt_at IS NULL OR last_attempt_at < now() - interval '5 minutes'
     ORDER BY last_attempt_at ASC NULLS FIRST, created_at ASC LIMIT 20`,
  );
  for (const row of pending) {
    const key = String(row.object_key ?? "");
    try {
      if (!key.startsWith("bizon/media/")) throw new Error("cleanup key outside CMS media prefix");
      await store.delete({ key });
      await query("DELETE FROM cms_media_cleanup WHERE object_key = $1", [key]);
    } catch {
      try {
        await query(
          "UPDATE cms_media_cleanup SET attempts = attempts + 1, last_attempt_at = now() WHERE object_key = $1",
          [key],
        );
      } catch {
        console.error("media.cleanup_attempt_record_failed", { key });
      }
      console.error("media.orphan_cleanup_retry_failed", { key });
    }
  }
}
