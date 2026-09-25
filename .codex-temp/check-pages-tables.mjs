import pg from "pg";
const c = new pg.Client(process.env.DATABASE_URI);
await c.connect();
const r = await c.query("SELECT tablename FROM pg_tables WHERE tablename LIKE 'pages%' ORDER BY 1");
console.log(r.rows);
const m = await c.query("SELECT name FROM payload_migrations WHERE name LIKE '%pages%'");
console.log(m.rows);
await c.end();
