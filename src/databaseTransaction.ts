import { AsyncLocalStorage } from "node:async_hooks";
import type { Pool, PoolClient } from "pg";

type TransactionContext = {
  client: PoolClient;
  afterCommit: Array<() => Promise<void>>;
};

const transactionContext = new AsyncLocalStorage<TransactionContext>();

export function serializeClientQueries(client: PoolClient): PoolClient {
  let queue: Promise<unknown> = Promise.resolve();
  const query = ((...args: Parameters<PoolClient["query"]>) => {
    const next = queue.then(() => Reflect.apply(client.query, client, args));
    queue = next.then(() => undefined, () => undefined);
    return next;
  }) as PoolClient["query"];

  return new Proxy(client, {
    get(target, property) {
      if (property === "query") return query;
      const value = Reflect.get(target, property, target) as unknown;
      return typeof value === "function" ? value.bind(target) : value;
    },
  });
}

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
  const transactionClient = serializeClientQueries(client);
  const context: TransactionContext = { client: transactionClient, afterCommit: [] };
  try {
    await transactionClient.query("BEGIN");
    const result = await transactionContext.run(context, () => work(transactionClient));
    await transactionClient.query("COMMIT");
    for (const callback of context.afterCommit) {
      try {
        await callback();
      } catch (error) {
        console.error("database.after_commit_callback_failed", error);
      }
    }
    return result;
  } catch (error) {
    await transactionClient.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
