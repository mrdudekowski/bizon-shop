import pg from "pg";

const client = new pg.Client({
  connectionString: process.env.DATABASE_URI,
});
await client.connect();
const r = await client.query(
  `SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'users' ORDER BY ordinal_position`,
);
console.log(r.rows);
const u = await client.query(`SELECT id, email, hash, salt FROM users LIMIT 5`);
console.log(u.rows.map((x) => ({ id: x.id, email: x.email, hash: x.hash?.slice?.(0, 20), salt: x.salt?.slice?.(0, 20) })));
await client.end();
