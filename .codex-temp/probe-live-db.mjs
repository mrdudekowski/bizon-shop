import fs from "fs";
import pg from "pg";

const env = fs.readFileSync(".env.local", "utf8");
const m = env.match(/^DATABASE_URI=(.+)$/m);
if (!m) throw new Error("no DATABASE_URI");
const uri = m[1].trim().replace(/^["']|["']$/g, "");
const safe = uri.replace(/:\/\/([^:]+):([^@]+)@/, "://$1:***@");
console.log("URI", safe);

const client = new pg.Client({ connectionString: uri });
await client.connect();

async function q(label, sql) {
  try {
    const r = await client.query(sql);
    console.log(label, JSON.stringify(r.rows, null, 0));
  } catch (e) {
    console.log(label, "ERR", e.message);
  }
}

await q("models_by_status", "SELECT status, count(*)::int AS n FROM tire_models GROUP BY 1 ORDER BY 1");
await q("models", "SELECT id, name, slug, status FROM tire_models ORDER BY id");
await q("features", "SELECT count(*)::int AS n FROM tire_models_features");
await q(
  "features_per_model",
  `SELECT tm.slug, count(f.*)::int AS feats
   FROM tire_models tm
   LEFT JOIN tire_models_features f ON f._parent_id = tm.id
   GROUP BY tm.slug ORDER BY tm.slug`,
);
await q(
  "variants_per_model",
  `SELECT tm.slug, tm.status AS model_status, count(v.*)::int AS vars,
          count(*) FILTER (WHERE v.status = 'published')::int AS pub_vars
   FROM tire_models tm
   LEFT JOIN tire_variants v ON v.tire_model_id = tm.id
   GROUP BY tm.slug, tm.status ORDER BY tm.slug`,
);
await q("tire_types", "SELECT id, slug, name, status FROM tire_types ORDER BY id");
await client.end();
