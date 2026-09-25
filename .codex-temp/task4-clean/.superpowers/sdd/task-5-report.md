# Task 5 report: database migration (staging first)

## Status

COMPLETED on staging only.

- Required URI used for every database command:
  `postgresql://postgres:postgres@127.0.0.1:55433/bizon_payload_stage`
- Database identity check returned `bizon_payload_stage`. PostgreSQL reported its
  container-side server port as `5432`; the connection used the required host
  mapping on `55433`.
- Production `127.0.0.1:5432/bizon` was not accessed.
- `postgresAdapter.push` remains `false`.

## Schema inspection

Before migration:

- `model_features`: 70 rows
- `tire_models_features`: absent
- `tire_models_advantages`: 0 rows
- `tire_models_validation_warnings`: 0 rows
- `tire_variants_validation_warnings`: 2 rows
- Tire models: 24
- Tire variants: 48
- Empty model codes: 0
- Empty SKUs eligible for backfill: 48

The schema already matched
`20260726_105520_bizon_refactor_baseline`, but Payload history contained only a
`dev` marker for that state. Running the pending baseline would have attempted
to recreate the populated `model_features` table. After asserting the exact
staging database name, the presence of `model_features`, absence of
`tire_models_features`, and presence of the `dev` marker, the baseline was
recorded as batch 5. No baseline SQL was rerun and no source rows were changed.

## Migration

Created `20260727_015500_tire_catalog_manager_ux`.

The migration:

- creates the canonical `tire_models_features` array table;
- copies all 70 `model_features` rows;
- uses legacy advantages only for models with no copied features;
- backfills model codes and SKUs;
- resolves the one duplicate base SKU (`DSR188-12.00R20`) with a deterministic
  PR suffix for the second variant;
- removes catalog IDs, verification fields, publish blocking, source snapshots,
  validation-warning tables, legacy advantages, the collection table, and
  obsolete enums;
- adds the array foreign key and indexes.

`npx.cmd payload migrate` succeeded:

```text
Migrated: 20260727_015500_tire_catalog_manager_ux (191ms)
```

Post-migration checks:

- Tire models: 24
- Tire model features: 70
- Variants with non-empty SKU: 48
- Remaining obsolete tire model/variant columns: 0
- Payload migration status: all six migrations applied; Task 5 is batch 6

## Generated files and verification

- Regenerated `src/payload-types.ts` successfully.
- Deleted the obsolete untracked `src/collections/ModelFeatures.ts`.
- Confirmed generated types and registered source contain no
  `model-features` collection reference.
- Targeted tests: 3 files, 17 tests passed.
- Migration ESLint: 0 errors, 0 warnings.
- `git diff --check`: passed.
- Full `tsc --noEmit` remains red because pre-existing seed scripts and CMS
  mappers still reference fields removed by earlier schema tasks; Task 5 did not
  modify those out-of-scope consumers.

## Commit

`96af312 feat(tires): migrate features onto models and drop import verification schema`

The commit contains only `src/migrations/**` and generated
`src/payload-types.ts`. The report is intentionally not included in that commit.

## Important review fixes

- Hardened the future-environment SKU backfill against mixed-state collisions
  with non-empty SKUs on other rows; deterministic duplicate suffixing remains.
- Retired `import-tbr-catalog.ts` with an immediate non-zero error before
  Payload can load or target the removed `model-features` collection.
- Added a production warning to the baseline migration. Staging had already
  applied the manager UX migration, so its SQL was not rerun; this edit protects
  dev/production environments that have not applied it.
- Focused verification: 5 files, 13 tests passed; changed-file ESLint passed;
  `npm run import:tbr` exited non-zero with the expected retirement message.
