import pg from "pg";

const c = new pg.Client(
  "postgresql://postgres:postgres@127.0.0.1:55433/bizon_payload_stage",
);
await c.connect();

async function describe(table) {
  const cols = await c.query(
    `SELECT column_name, data_type, udt_name
     FROM information_schema.columns
     WHERE table_name = $1
     ORDER BY ordinal_position`,
    [table],
  );
  console.log(`\n=== ${table} ===`);
  for (const row of cols.rows) {
    console.log(`  ${row.column_name}: ${row.udt_name}`);
  }
}

const arrays = await c.query(
  `SELECT tablename FROM pg_tables
   WHERE schemaname='public'
     AND (tablename LIKE '%features%' OR tablename LIKE '%gallery%' OR tablename LIKE 'wheel%')
   ORDER BY tablename`,
);
console.log("candidate tables", arrays.rows.map((r) => r.tablename));

await describe("tire_models_features");
await describe("people_stories_rels");
await describe("payload_locked_documents_rels");

const enums = await c.query(
  `SELECT t.typname, e.enumlabel
   FROM pg_type t
   JOIN pg_enum e ON t.oid = e.enumtypid
   WHERE t.typname LIKE 'enum_%status%' OR t.typname LIKE 'enum_people%'
   ORDER BY t.typname, e.enumsortorder`,
);
console.log("\nenums sample");
for (const row of enums.rows) console.log(`  ${row.typname}.${row.enumlabel}`);

await c.end();
