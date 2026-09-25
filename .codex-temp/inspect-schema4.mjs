import pg from "pg";

const c = new pg.Client(
  "postgresql://postgres:postgres@127.0.0.1:55433/bizon_payload_stage",
);
await c.connect();
const tables = await c.query(
  `SELECT tablename FROM pg_tables WHERE schemaname='public' AND tablename LIKE 'products%' ORDER BY 1`,
);
console.log(tables.rows.map((r) => r.tablename));

for (const name of tables.rows.map((r) => r.tablename)) {
  const cols = await c.query(
    `SELECT column_name, udt_name FROM information_schema.columns WHERE table_name=$1 ORDER BY ordinal_position`,
    [name],
  );
  console.log(`\n=== ${name} ===`);
  for (const row of cols.rows) console.log(`  ${row.column_name}: ${row.udt_name}`);
}
await c.end();
