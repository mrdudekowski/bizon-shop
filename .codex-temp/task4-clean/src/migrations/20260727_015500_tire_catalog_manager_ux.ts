import { type MigrateUpArgs, sql } from "@payloadcms/db-postgres";

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    DO $$
    BEGIN
      IF EXISTS (
        SELECT 1 FROM pg_type WHERE typname = 'enum_model_features_key'
      ) AND NOT EXISTS (
        SELECT 1 FROM pg_type WHERE typname = 'enum_tire_models_features_key'
      ) THEN
        ALTER TYPE "public"."enum_model_features_key"
          RENAME TO "enum_tire_models_features_key";
      ELSIF NOT EXISTS (
        SELECT 1 FROM pg_type WHERE typname = 'enum_tire_models_features_key'
      ) THEN
        CREATE TYPE "public"."enum_tire_models_features_key" AS ENUM(
          'handling',
          'safety',
          'high-mileage',
          'economy',
          'wet-grip',
          'anti-wear',
          'anti-tear',
          'short-braking-distance',
          'low-noise',
          'heavy-load',
          'self-cleaning',
          'retreadability',
          'stone-ejection',
          'low-rolling-resistance',
          'heat-dissipation',
          'cut-resistance',
          'puncture-resistance'
        );
      END IF;
    END
    $$;

    CREATE TABLE IF NOT EXISTS "tire_models_features" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "key" "enum_tire_models_features_key" NOT NULL,
      "title" varchar NOT NULL,
      "description" varchar
    );

    ALTER TABLE "tire_models_features"
      DROP COLUMN IF EXISTS "source_text",
      DROP COLUMN IF EXISTS "verification_status";

    INSERT INTO "tire_models_features" (
      "_order",
      "_parent_id",
      "id",
      "key",
      "title",
      "description"
    )
    SELECT
      "feature_order"::integer,
      "tire_model_id",
      'model-feature-' || "id"::text,
      "key"::text::"enum_tire_models_features_key",
      "title_ru",
      "description_ru"
    FROM "model_features"
    ON CONFLICT ("id") DO NOTHING;

    -- Legacy advantages have no taxonomy key. Preserve them as economy features
    -- only for models that still have no canonical feature rows.
    INSERT INTO "tire_models_features" (
      "_order",
      "_parent_id",
      "id",
      "key",
      "title",
      "description"
    )
    SELECT
      advantage."_order",
      advantage."_parent_id",
      'legacy-advantage-' || advantage."id",
      'economy'::"enum_tire_models_features_key",
      advantage."title",
      advantage."description"
    FROM "tire_models_advantages" advantage
    WHERE NOT EXISTS (
      SELECT 1
      FROM "tire_models_features" feature
      WHERE feature."_parent_id" = advantage."_parent_id"
    )
    ON CONFLICT ("id") DO NOTHING;

    UPDATE "tire_models"
    SET "model_code" = COALESCE(
      NULLIF(regexp_replace(upper(trim("slug")), '[^A-Z0-9]+', '', 'g'), ''),
      'MODEL'
    )
    WHERE "model_code" IS NULL OR trim("model_code") = '';

    WITH proposed_skus AS (
      SELECT
        variant."id",
        regexp_replace(upper(trim(model."model_code")), '[^A-Z0-9]+', '', 'g')
          || '-'
          || replace(
            regexp_replace(upper(trim(variant."size_normalized")), '\s+', '', 'g'),
            '/',
            '-'
          ) AS base_sku,
        variant."ply_rating_pr",
        row_number() OVER (
          PARTITION BY
            regexp_replace(upper(trim(model."model_code")), '[^A-Z0-9]+', '', 'g'),
            replace(
              regexp_replace(upper(trim(variant."size_normalized")), '\s+', '', 'g'),
              '/',
              '-'
            )
          ORDER BY variant."id"
        ) AS duplicate_number
      FROM "tire_variants" variant
      JOIN "tire_models" model ON model."id" = variant."tire_model_id"
      WHERE (variant."sku" IS NULL OR trim(variant."sku") = '')
        AND variant."size_normalized" IS NOT NULL
        AND trim(variant."size_normalized") <> ''
    ),
    candidate_skus AS (
      SELECT
        proposed."id",
        CASE
          WHEN proposed.duplicate_number = 1 THEN proposed.base_sku
          WHEN proposed."ply_rating_pr" IS NOT NULL
            THEN proposed.base_sku || '-' || proposed."ply_rating_pr"::text || 'PR'
          ELSE proposed.base_sku || '-' || proposed.duplicate_number::text
        END AS candidate_sku
      FROM proposed_skus proposed
    )
    UPDATE "tire_variants" variant
    SET "sku" = proposed.candidate_sku
    FROM candidate_skus proposed
    WHERE variant."id" = proposed."id"
      -- Mixed-state databases may already contain a candidate SKU on another row.
      AND NOT EXISTS (
        SELECT 1
        FROM "tire_variants" occupied
        WHERE occupied."id" <> proposed."id"
          AND occupied."sku" IS NOT NULL
          AND trim(occupied."sku") <> ''
          AND trim(occupied."sku") = proposed.candidate_sku
      );

    DROP TABLE IF EXISTS "tire_models_validation_warnings" CASCADE;
    DROP TABLE IF EXISTS "tire_variants_validation_warnings" CASCADE;
    DROP TABLE IF EXISTS "tire_models_advantages" CASCADE;
    DROP TABLE IF EXISTS "model_features" CASCADE;

    ALTER TABLE "tire_models"
      DROP COLUMN IF EXISTS "catalog_id",
      DROP COLUMN IF EXISTS "verification_status",
      DROP COLUMN IF EXISTS "publish_blocked",
      DROP COLUMN IF EXISTS "source_snapshot_source_document",
      DROP COLUMN IF EXISTS "source_snapshot_source_sheet",
      DROP COLUMN IF EXISTS "source_snapshot_source_page",
      DROP COLUMN IF EXISTS "source_snapshot_source_row_number",
      DROP COLUMN IF EXISTS "source_snapshot_source_data_raw",
      DROP COLUMN IF EXISTS "source_snapshot_source_unit_labels",
      DROP COLUMN IF EXISTS "source_snapshot_imported_at",
      DROP COLUMN IF EXISTS "source_snapshot_import_batch_id";

    ALTER TABLE "tire_variants"
      DROP COLUMN IF EXISTS "catalog_id",
      DROP COLUMN IF EXISTS "verification_status",
      DROP COLUMN IF EXISTS "publish_blocked",
      DROP COLUMN IF EXISTS "source_snapshot_source_document",
      DROP COLUMN IF EXISTS "source_snapshot_source_sheet",
      DROP COLUMN IF EXISTS "source_snapshot_source_page",
      DROP COLUMN IF EXISTS "source_snapshot_source_row_number",
      DROP COLUMN IF EXISTS "source_snapshot_source_data_raw",
      DROP COLUMN IF EXISTS "source_snapshot_source_unit_labels",
      DROP COLUMN IF EXISTS "source_snapshot_imported_at",
      DROP COLUMN IF EXISTS "source_snapshot_import_batch_id";

    DROP TYPE IF EXISTS "public"."enum_model_features_verification_status";
    DROP TYPE IF EXISTS "public"."enum_model_features_key";
    DROP TYPE IF EXISTS "public"."enum_tire_models_features_verification_status";
    DROP TYPE IF EXISTS "public"."enum_tire_models_validation_warnings_severity";
    DROP TYPE IF EXISTS "public"."enum_tire_models_verification_status";
    DROP TYPE IF EXISTS "public"."enum_tire_variants_validation_warnings_severity";
    DROP TYPE IF EXISTS "public"."enum_tire_variants_verification_status";

    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'tire_models_features_parent_id_fk'
      ) THEN
        ALTER TABLE "tire_models_features"
          ADD CONSTRAINT "tire_models_features_parent_id_fk"
          FOREIGN KEY ("_parent_id")
          REFERENCES "public"."tire_models"("id")
          ON DELETE cascade
          ON UPDATE no action;
      END IF;
    END
    $$;

    CREATE INDEX IF NOT EXISTS "tire_models_features_order_idx"
      ON "tire_models_features" USING btree ("_order");
    CREATE INDEX IF NOT EXISTS "tire_models_features_parent_id_idx"
      ON "tire_models_features" USING btree ("_parent_id");
  `);
}

export async function down(): Promise<void> {
  throw new Error(
    "Down migration is not supported because source verification data was removed.",
  );
}
