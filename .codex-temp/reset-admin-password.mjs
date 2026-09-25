import crypto from "node:crypto";
import pg from "pg";

const password = process.env.ADMIN_PASSWORD || "admin";
const email = process.env.ADMIN_EMAIL || "mrdudekowski@yandex.ru";

const salt = crypto.randomBytes(32).toString("hex");
const hash = crypto.pbkdf2Sync(password, salt, 25000, 512, "sha256").toString("hex");

const client = new pg.Client({ connectionString: process.env.DATABASE_URI });
await client.connect();
const res = await client.query(
  `UPDATE users
   SET hash = $1,
       salt = $2,
       login_attempts = 0,
       lock_until = NULL,
       updated_at = NOW()
   WHERE email = $3
   RETURNING id, email, role, status`,
  [hash, salt, email],
);
console.log(JSON.stringify({ updated: res.rowCount, password, rows: res.rows }, null, 2));
await client.end();
