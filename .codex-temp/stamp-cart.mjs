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
  SELECT column_name, data_type
  FROM information_schema.columns
  WHERE table_name = 'payload_migrations'
`);
console.log(cols.rows);

const existing = await c.query(
  `SELECT id FROM payload_migrations WHERE name = $1`,
  ["20260726_041541_add_cart_sessions"],
);
if (!existing.rows.length) {
  await c.query(
    `INSERT INTO payload_migrations (name, batch, created_at) VALUES ($1, $2, NOW())`,
    ["20260726_041541_add_cart_sessions", "3"],
  );
  console.log("stamped");
} else {
  console.log("already stamped", existing.rows[0].id);
}

const all = await c.query(`SELECT id, name, batch FROM payload_migrations ORDER BY id`);
console.log(all.rows);
await c.end();
