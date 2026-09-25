import pg from "pg";

const client = new pg.Client({
  host: "127.0.0.1",
  port: 5432,
  user: "postgres",
  password: "8955",
  database: "bizon",
  connectionTimeoutMillis: 4000,
});

await client.connect();

const tables = await client.query(`
  SELECT tablename
  FROM pg_tables
  WHERE schemaname = 'public'
    AND (
      tablename LIKE 'tire_%'
      OR tablename LIKE 'wheel_%'
      OR tablename LIKE 'media%'
      OR tablename = 'pages'
    )
  ORDER BY 1
`);
console.log("tables:", tables.rows.map((r) => r.tablename));

// Check gallery relations
const tireRels = await client.query(`
  SELECT parent_id, path, media_id
  FROM tire_models_rels
  LIMIT 20
`).catch((e) => ({ rows: [], error: e.message }));
console.log("tire_models_rels:", tireRels.error || tireRels.rows);

const wheelRels = await client.query(`
  SELECT parent_id, path, media_id
  FROM wheel_models_rels
  LIMIT 20
`).catch((e) => ({ rows: [], error: e.message }));
console.log("wheel_models_rels:", wheelRels.error || wheelRels.rows);

// Reproduce payload-like query failure by selecting with joins
const joinChecks = [
  `SELECT count(*) FROM tire_models_positions`,
  `SELECT count(*) FROM tire_models_application_types`,
  `SELECT count(*) FROM tire_models_features`,
  `SELECT count(*) FROM tire_models_rels`,
  `SELECT count(*) FROM tire_variants`,
  `SELECT count(*) FROM wheel_models_rels`,
  `SELECT count(*) FROM media`,
];

for (const sql of joinChecks) {
  try {
    const r = await client.query(sql);
    console.log("OK", sql, "->", r.rows[0].count);
  } catch (e) {
    console.log("FAIL", sql, "->", e.message);
  }
}

// Exact style of failing select (simplified)
try {
  const r = await client.query(`
    SELECT
      tire_models.id,
      tire_models.name,
      tire_models.main_image_id,
      tire_models.status,
      tire_models_positions.data AS positions,
      tire_models_applicationTypes.data AS "applicationTypes",
      tire_models_features.data AS features,
      tire_models__rels.data AS _rels
    FROM tire_models
    LEFT JOIN LATERAL (
      SELECT coalesce(json_agg(json_build_array(tire_models_positions.value) ORDER BY tire_models_positions."order" ASC), '[]'::json) AS data
      FROM (
        SELECT * FROM tire_models_positions
        WHERE tire_models_positions.parent_id = tire_models.id
        ORDER BY tire_models_positions."order" ASC
      ) tire_models_positions
    ) tire_models_positions ON true
    LEFT JOIN LATERAL (
      SELECT coalesce(json_agg(json_build_array(tire_models_applicationTypes.value) ORDER BY tire_models_applicationTypes."order" ASC), '[]'::json) AS data
      FROM (
        SELECT * FROM tire_models_application_types tire_models_applicationTypes
        WHERE tire_models_applicationTypes.parent_id = tire_models.id
        ORDER BY tire_models_applicationTypes."order" ASC
      ) tire_models_applicationTypes
    ) tire_models_applicationTypes ON true
    LEFT JOIN LATERAL (
      SELECT coalesce(json_agg(json_build_array(
        tire_models_features._order,
        tire_models_features.id,
        tire_models_features.key,
        tire_models_features.title,
        tire_models_features.description
      ) ORDER BY tire_models_features._order ASC), '[]'::json) AS data
      FROM (
        SELECT * FROM tire_models_features
        WHERE tire_models_features._parent_id = tire_models.id
        ORDER BY tire_models_features._order ASC
      ) tire_models_features
    ) tire_models_features ON true
    LEFT JOIN LATERAL (
      SELECT coalesce(json_agg(json_build_array(
        tire_models__rels."order",
        tire_models__rels.path,
        tire_models__rels.media_id
      ) ORDER BY tire_models__rels."order" ASC), '[]'::json) AS data
      FROM (
        SELECT * FROM tire_models_rels tire_models__rels
        WHERE tire_models__rels.parent_id = tire_models.id
        ORDER BY tire_models__rels."order" ASC
      ) tire_models__rels
    ) tire_models__rels ON true
    WHERE tire_models.status = 'published'
    LIMIT 2
  `);
  console.log("complex query OK rows:", r.rows.length, JSON.stringify(r.rows[0], null, 2));
} catch (e) {
  console.log("complex query FAIL:", e.message);
}

// Check pages table columns
const pageCols = await client.query(`
  SELECT column_name FROM information_schema.columns
  WHERE table_name = 'pages' ORDER BY ordinal_position
`);
console.log("pages cols:", pageCols.rows.map((r) => r.column_name).join(","));

try {
  await client.query(`SELECT count(*) FROM pages WHERE key = $1 AND status = $2`, [
    "home",
    "published",
  ]);
  console.log("pages query OK");
} catch (e) {
  console.log("pages query FAIL:", e.message);
}

await client.end();
