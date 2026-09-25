import pg from "pg";

const targets = [
  {
    label: "local5432",
    host: "127.0.0.1",
    port: 5432,
    user: "postgres",
    password: "8955",
    database: "bizon",
  },
  {
    label: "docker5433",
    host: "127.0.0.1",
    port: 5433,
    user: "postgres",
    password: "postgres",
    database: "bizon",
  },
  {
    label: "stage55433",
    host: "127.0.0.1",
    port: 55433,
    user: "postgres",
    password: "postgres",
    database: "postgres",
  },
];

for (const cfg of targets) {
  const client = new pg.Client({ ...cfg, connectionTimeoutMillis: 4000 });
  try {
    await client.connect();
    const tables = await client.query(`
      SELECT tablename
      FROM pg_tables
      WHERE schemaname = 'public'
        AND tablename IN ('media', 'tire_models', 'wheel_models', 'pages')
      ORDER BY 1
    `);
    const cols = await client.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'tire_models'
        AND column_name IN ('status', '_status', 'main_image_id')
      ORDER BY 1
    `);
    console.log(
      `${cfg.label}: OK tables=${tables.rows.map((r) => r.tablename).join(",")} cols=${cols.rows
        .map((r) => r.column_name)
        .join(",")}`,
    );

    if (tables.rows.some((r) => r.tablename === "media")) {
      const media = await client.query(
        `SELECT id, filename, url, prefix FROM media ORDER BY id DESC LIMIT 3`,
      );
      console.log(`${cfg.label} media:`, JSON.stringify(media.rows, null, 0));
      const count = await client.query(`SELECT count(*)::int AS n FROM media`);
      console.log(`${cfg.label} media count:`, count.rows[0].n);
    }

    if (tables.rows.some((r) => r.tablename === "tire_models")) {
      const tires = await client.query(
        `SELECT id, name, slug, main_image_id, status FROM tire_models LIMIT 5`,
      );
      console.log(`${cfg.label} tires:`, JSON.stringify(tires.rows, null, 0));
    }

    if (tables.rows.some((r) => r.tablename === "wheel_models")) {
      const wheels = await client.query(
        `SELECT id, name, slug, main_image_id, status FROM wheel_models LIMIT 5`,
      );
      console.log(`${cfg.label} wheels:`, JSON.stringify(wheels.rows, null, 0));
    }

    // Reproduce the failing query shape more closely
    if (tables.rows.some((r) => r.tablename === "tire_models")) {
      try {
        const q = await client.query(
          `SELECT id, name, main_image_id, status FROM tire_models WHERE status = $1 LIMIT 2`,
          ["published"],
        );
        console.log(`${cfg.label} published tires:`, q.rows.length);
      } catch (e) {
        console.log(`${cfg.label} published query FAIL:`, e.message);
      }
    }

    await client.end();
  } catch (e) {
    console.log(`${cfg.label}: FAIL ${e.message}`);
    try {
      await client.end();
    } catch {
      /* ignore */
    }
  }
}
