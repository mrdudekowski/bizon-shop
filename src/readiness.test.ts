import { describe, expect, it } from "vitest";
import { checkBackendReadiness } from "./readiness";
import { MIGRATIONS } from "./migrations";

describe("backend readiness", () => {
  it("checks the database connection and all registered migrations", async () => {
    const statements: string[] = [];
    await checkBackendReadiness(async (sql) => {
      statements.push(sql);
      if (sql.startsWith("SELECT version")) {
        return MIGRATIONS.map(({ version }) => ({ version }));
      }
      return [];
    });
    expect(statements).toEqual([
      "SELECT 1",
      "SELECT version FROM cms_schema_migrations ORDER BY version",
    ]);
  });

  it("fails when the database is unavailable", async () => {
    await expect(
      checkBackendReadiness(async () => {
        throw new Error("database unavailable");
      }),
    ).rejects.toThrow("Backend is not ready");
  });
});
