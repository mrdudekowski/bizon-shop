import pg from "pg";

const uri =
  process.env.DATABASE_URI ||
  "postgresql://postgres:postgres@127.0.0.1:55433/bizon_payload_stage";
const c = new pg.Client(uri);
await c.connect();
const cols = await c.query(
  `SELECT column_name, data_type
   FROM information_schema.columns
   WHERE table_name = 'people_stories'
   ORDER BY ordinal_position`,
);
console.log("people_stories columns:");
for (const row of cols.rows) console.log(`  ${row.column_name}: ${row.data_type}`);

const tables = await c.query(
  `SELECT tablename FROM pg_tables
   WHERE schemaname = 'public'
     AND (tablename LIKE '%people%' OR tablename LIKE '%rels%' OR tablename = 'payload_migrations')
   ORDER BY tablename
   LIMIT 40`,
);
console.log("tables:", tables.rows.map((r) => r.tablename));
await c.end();
