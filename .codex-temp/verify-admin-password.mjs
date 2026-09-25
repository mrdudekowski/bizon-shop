import crypto from "node:crypto";
import pg from "pg";

const password = "admin";
const email = "mrdudekowski@yandex.ru";
const client = new pg.Client({ connectionString: process.env.DATABASE_URI });
await client.connect();
const { rows } = await client.query(`SELECT salt, hash FROM users WHERE email = $1`, [email]);
const { salt, hash } = rows[0];
const check = crypto.pbkdf2Sync(password, salt, 25000, 512, "sha256").toString("hex");
console.log(JSON.stringify({ email, matches: check === hash }));
await client.end();
