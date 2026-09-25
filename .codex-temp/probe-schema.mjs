import pg from "pg";

const c = new pg.Client({
  host: "127.0.0.1",
  port: 5432,
  user: "postgres",
  password: "8955",
  database: "bizon",
});
await c.connect();

const cols = await c.query(`
  SELECT column_name
  FROM information_schema.columns
  WHERE table_name = 'tire_models'
  ORDER BY ordinal_position
`);
console.log("tire_models columns:\n" + cols.rows.map((r) => r.column_name).join("\n"));

const mig = await c.query(`
  SELECT id, name, batch, created_at
  FROM payload_migrations
  ORDER BY id
`).catch((e) => ({ rows: [], error: e.message }));
console.log("\nmigrations:", mig.error || mig.rows);

const allTire = await c.query(`
  SELECT tablename FROM pg_tables
  WHERE schemaname='public' AND tablename LIKE 'tire_%'
  ORDER BY 1
`);
console.log("\ntire_* tables:", allTire.rows.map((r) => r.tablename));

await c.end();
