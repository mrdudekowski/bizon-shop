import pg from "pg";

const c = new pg.Client(
  "postgresql://postgres:postgres@127.0.0.1:55433/bizon_payload_stage",
);
await c.connect();

async function describe(table) {
  const cols = await c.query(
    `SELECT column_name, udt_name
     FROM information_schema.columns
     WHERE table_name = $1
     ORDER BY ordinal_position`,
    [table],
  );
  console.log(`\n=== ${table} ===`);
  if (!cols.rows.length) {
    console.log("  (missing)");
    return;
  }
  for (const row of cols.rows) console.log(`  ${row.column_name}: ${row.udt_name}`);
}

const tables = await c.query(
  `SELECT tablename FROM pg_tables WHERE schemaname='public' AND tablename LIKE 'tire_models%' ORDER BY 1`,
);
console.log(tables.rows.map((r) => r.tablename));
await describe("tire_models");
await describe("tire_models_rels");
await describe("tire_models_features");
await c.end();
