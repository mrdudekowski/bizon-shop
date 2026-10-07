import { describe, expect, it } from "vitest";
import { assertSchemaReady } from "./schemaReadiness";
import { MIGRATIONS } from "./migrations";

describe("database schema readiness", () => {
  it("accepts a database with every registered migration", async () => {
    const versions = MIGRATIONS.map(({ version }) => ({ version }));
    await expect(assertSchemaReady(async () => versions)).resolves.toBeUndefined();
  });

  it("fails clearly when migrations have not been applied", async () => {
    await expect(assertSchemaReady(async () => { throw Object.assign(new Error("relation missing"), { code: "42P01" }); }))
      .rejects.toThrow("npm run db:migrate");
  });

  it("does not misreport a database connection failure as a missing migration", async () => {
    await expect(assertSchemaReady(async () => { throw Object.assign(new Error("connection refused"), { code: "ECONNREFUSED" }); }))
      .rejects.toThrow("Could not verify database schema readiness");
  });

  it("rejects a database missing an earlier migration", async () => {
    await expect(assertSchemaReady(async () => [{ version: MIGRATIONS.at(-1)?.version }]))
      .rejects.toThrow("expected every migration");
  });
});
