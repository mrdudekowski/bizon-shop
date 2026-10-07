import { describe, expect, it } from "vitest";
import { runMigrations, type Migration } from "./migrationRunner";

function database() {
  const applied = new Set<string>();
  const statements: string[] = [];
  let inTransaction = false;
  const client = {
    async query(sql: string, params: unknown[] = []) {
      statements.push(sql.trim());
      if (sql === "BEGIN") inTransaction = true;
      if (sql === "COMMIT" || sql === "ROLLBACK") inTransaction = false;
      if (sql.includes("SELECT version FROM cms_schema_migrations")) {
        return { rows: [...applied].map((version) => ({ version })) };
      }
      if (sql.includes("INSERT INTO cms_schema_migrations")) applied.add(String(params[0]));
      return { rows: [] };
    },
    release() {},
  };
  return {
    pool: { async connect() { return client; } },
    applied,
    statements,
    transactionOpen: () => inTransaction,
  };
}

describe("migration runner", () => {
  it("applies each migration once under a transaction", async () => {
    const db = database();
    const migrations: Migration[] = [
      { version: "0001", description: "first", sql: "CREATE TABLE sample (id integer)" },
    ];

    await runMigrations(db.pool, migrations);
    await runMigrations(db.pool, migrations);

    expect(db.applied).toEqual(new Set(["0001"]));
    expect(db.statements.filter((statement) => statement === migrations[0].sql)).toHaveLength(1);
    expect(db.statements).toContain("SELECT pg_advisory_lock($1)");
    expect(db.statements).toContain("COMMIT");
    expect(db.transactionOpen()).toBe(false);
  });
});
