import pg from "pg";

const c = new pg.Client({
  host: "127.0.0.1",
  port: 5432,
  user: "postgres",
  password: "8955",
  database: "bizon",
});
await c.connect();

const checks = [
  `SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='cart_sessions') AS exists`,
  `SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tire_models' AND column_name='model_code') AS exists`,
  `SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='tire_models_positions') AS exists`,
  `SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='pages') AS exists`,
  `SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='payload_locked_documents_rels' AND column_name='cart_sessions_id') AS exists`,
];

for (const sql of checks) {
  const r = await c.query(sql);
  console.log(sql.slice(0, 80), "->", r.rows[0].exists);
}

const enums = await c.query(`
  SELECT e.enumlabel
  FROM pg_enum e
  JOIN pg_type t ON e.enumtypid = t.oid
  WHERE t.typname = 'enum_requests_source_form'
  ORDER BY e.enumsortorder
`);
console.log("enum_requests_source_form:", enums.rows.map((r) => r.enumlabel).join(", "));

await c.end();
