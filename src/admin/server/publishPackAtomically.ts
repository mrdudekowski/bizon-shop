import type { Pool } from "pg";

import { withTransaction } from "../../databaseTransaction";
import { publishEntriesThenMark } from "../domain/publishEntries";

export function publishPackAtomically<T>(
  pool: Pool,
  entries: T[],
  publishEntry: (entry: T) => Promise<void>,
  markPublished: () => Promise<void>,
): Promise<void> {
  return withTransaction(pool, () => publishEntriesThenMark(entries, publishEntry, markPublished));
}
