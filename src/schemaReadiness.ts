import { MIGRATIONS } from "./migrations";

export type SchemaVersionQuery = (sql: string) => Promise<Record<string, unknown>[]>;

export async function assertSchemaReady(query: SchemaVersionQuery): Promise<void> {
  let rows: Record<string, unknown>[];
  try {
    rows = await query("SELECT version FROM cms_schema_migrations ORDER BY version");
  } catch (error) {
    if ((error as { code?: string }).code === "42P01") {
      throw new Error("Database schema is not initialized; run `npm run db:migrate` before starting the backend", { cause: error });
    }
    throw new Error("Could not verify database schema readiness", { cause: error });
  }

  const appliedVersions = rows.map(({ version }) => String(version));
  const expectedVersions = MIGRATIONS.map(({ version }) => version);
  if (JSON.stringify(appliedVersions) !== JSON.stringify(expectedVersions)) {
    const currentVersion = appliedVersions.at(-1) ?? "0";
    throw new Error(
      `Database schema is at ${currentVersion}; expected every migration through ${expectedVersions.at(-1)}. Run ` +
        "`npm run db:migrate` before starting the backend",
    );
  }
}
