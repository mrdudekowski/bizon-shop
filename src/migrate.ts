import { Pool } from "pg";
import { runMigrations } from "./migrationRunner";
import { CURRENT_SCHEMA_VERSION } from "./migrations";

const connectionString = process.env.DATABASE_URI;
if (!connectionString) throw new Error("DATABASE_URI is required to run database migrations");

const pool = new Pool({ connectionString });

try {
  await runMigrations(pool);
  console.log(`Database schema is at ${CURRENT_SCHEMA_VERSION}`);
} catch (error) {
  console.error("Database migrations failed:", error instanceof Error ? error.message : "unknown error");
  process.exitCode = 1;
} finally {
  await pool.end();
}
