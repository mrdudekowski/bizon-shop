import { AsyncLocalStorage } from "node:async_hooks";
import type { Pool, PoolClient } from "pg";

type TransactionContext = {
  client: PoolClient;
  afterCommit: Array<() => Promise<void>>;
};

const transactionContext = new AsyncLocalStorage<TransactionContext>();

export function getTransactionClient(): PoolClient | undefined {
  return transactionContext.getStore()?.client;
}

export function afterTransactionCommit(callback: () => Promise<void>): void {
  const context = transactionContext.getStore();
  if (!context) throw new Error("afterTransactionCommit requires an active transaction");
  context.afterCommit.push(callback);
}

export async function withTransaction<T>(pool: Pool, work: (client: PoolClient) => Promise<T>): Promise<T> {
  const existing = getTransactionClient();
  if (existing) return work(existing);

  const client = await pool.connect();
  const context: TransactionContext = { client, afterCommit: [] };
  try {
    await client.query("BEGIN");
    const result = await transactionContext.run(context, () => work(client));
    await client.query("COMMIT");
    for (const callback of context.afterCommit) {
      try {
        await callback();
      } catch (error) {
        console.error("database.after_commit_callback_failed", error);
      }
    }
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
