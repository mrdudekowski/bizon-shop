import fs from "node:fs";
import path from "node:path";
import pg from "pg";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const migrationPath = path.join(
  root,
  "src/migrations/20260727_072000_add_site_pages.ts",
);
const source = fs.readFileSync(migrationPath, "utf8");
const match = source.match(/await db\.execute\(sql`([\s\S]*?)`\);\s*\n\}/);
if (!match) throw new Error("Could not extract SQL from migration");
const sqlText = match[1];

const client = new pg.Client(
  process.env.DATABASE_URI ||
    "postgresql://postgres:postgres@127.0.0.1:55433/bizon_payload_stage",
);
await client.connect();
try {
  await client.query("BEGIN");
  await client.query(sqlText);
  await client.query(`
    INSERT INTO payload_migrations (name, batch, updated_at, created_at)
    SELECT '20260727_072000_add_site_pages', COALESCE((SELECT MAX(batch) FROM payload_migrations), 0) + 1, now(), now()
    WHERE NOT EXISTS (
      SELECT 1 FROM payload_migrations WHERE name = '20260727_072000_add_site_pages'
    )
  `);
  await client.query("COMMIT");
  console.log("migration applied");
} catch (error) {
  await client.query("ROLLBACK");
  throw error;
} finally {
  await client.end();
}
