import { MIGRATIONS } from "./migrations";

export type Migration = {
  version: string;
  description: string;
  sql: string;
};

type MigrationClient = {
  query(
    sql: string,
    params?: unknown[],
  ): Promise<{ rows: Record<string, unknown>[] }>;
  release(): void;
};

type MigrationPool = { connect(): Promise<MigrationClient> };

const MIGRATION_LOCK_ID = 20261003;

export async function runMigrations(
  pool: MigrationPool,
  migrations: readonly Migration[] = MIGRATIONS,
): Promise<void> {
  const versions = migrations.map(({ version }) => version);
  if (new Set(versions).size !== versions.length || versions.some((version, index) => index > 0 && version <= versions[index - 1])) {
    throw new Error("Database migrations must have unique, ascending version identifiers");
  }

  const client = await pool.connect();
  let lockAcquired = false;
  try {
    await client.query("SELECT pg_advisory_lock($1)", [MIGRATION_LOCK_ID]);
    lockAcquired = true;

    await client.query("BEGIN");
    try {
      await client.query(`CREATE TABLE IF NOT EXISTS cms_schema_migrations (
        version text PRIMARY KEY,
        description text NOT NULL,
        applied_at timestamptz NOT NULL DEFAULT now()
      )`);
      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    }

    const result = await client.query("SELECT version FROM cms_schema_migrations");
    const applied = new Set(result.rows.map(({ version }) => String(version)));
    const knownVersions = new Set(versions);
    const unknownVersions = [...applied].filter((version) => !knownVersions.has(version));
    if (unknownVersions.length > 0) {
      throw new Error(`Database has unknown migration version(s): ${unknownVersions.join(", ")}`);
    }

    let foundPendingMigration = false;
    for (const migration of migrations) {
      if (!applied.has(migration.version)) {
        foundPendingMigration = true;
      } else if (foundPendingMigration) {
        throw new Error(`Database migration history is incomplete before ${migration.version}`);
      }
    }

    for (const migration of migrations) {
      if (applied.has(migration.version)) continue;
      await client.query("BEGIN");
      try {
        await client.query(migration.sql);
        await client.query(
          "INSERT INTO cms_schema_migrations (version, description) VALUES ($1, $2)",
          [migration.version, migration.description],
        );
        await client.query("COMMIT");
      } catch (error) {
        await client.query("ROLLBACK");
        throw new Error(`Database migration ${migration.version} failed`, { cause: error });
      }
    }
  } finally {
    if (lockAcquired) {
      try {
        await client.query("SELECT pg_advisory_unlock($1)", [MIGRATION_LOCK_ID]);
      } finally {
        client.release();
      }
    } else {
      client.release();
    }
  }
}
