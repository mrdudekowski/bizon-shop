// PRODUCTION WARNING: Stamping or reconciling this baseline outside staging
// requires an audited procedure. Never rerun it blindly when
// tire_models_features already contains data.
import { type MigrateDownArgs, type MigrateUpArgs, sql } from "@payloadcms/db-postgres";

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    DROP TABLE IF EXISTS "tire_models_features" CASCADE;
    DROP TYPE IF EXISTS "public"."enum_tire_models_features_key";
    DROP TYPE IF EXISTS "public"."enum_tire_models_features_verification_status";
    CREATE TYPE "public"."enum_model_features_key" AS ENUM('handling', 'safety', 'high-mileage', 'economy', 'wet-grip', 'anti-wear', 'anti-tear', 'short-braking-distance', 'low-noise', 'heavy-load', 'self-cleaning', 'retreadability', 'stone-ejection', 'low-rolling-resistance', 'heat-dissipation', 'cut-resistance', 'puncture-resistance');
    CREATE TYPE "public"."enum_model_features_verification_status" AS ENUM('sourceOnly', 'needsReview', 'verified');
    CREATE TABLE "model_features" (
      "id" serial PRIMARY KEY NOT NULL,
      "catalog_id" varchar NOT NULL,
      "tire_model_id" integer NOT NULL,
      "key" "enum_model_features_key" NOT NULL,
      "title_ru" varchar NOT NULL,
      "description_ru" varchar,
      "source_title_en" varchar,
      "source_description_en" varchar,
      "feature_order" numeric NOT NULL,
      "verification_status" "enum_model_features_verification_status" DEFAULT 'sourceOnly',
      "source_snapshot_source_document" varchar,
      "source_snapshot_source_sheet" varchar,
      "source_snapshot_source_page" numeric,
      "source_snapshot_source_row_number" numeric,
      "source_snapshot_source_data_raw" jsonb,
      "source_snapshot_source_unit_labels" jsonb,
      "source_snapshot_imported_at" timestamp(3) with time zone,
      "source_snapshot_import_batch_id" varchar,
      "updated_at" timestamp(3) with time zone NOT NULL,
      "created_at" timestamp(3) with time zone NOT NULL
    );
    ALTER TABLE "model_features" ADD CONSTRAINT "model_features_catalog_id_unique" UNIQUE("catalog_id");
    ALTER TABLE "model_features" ADD CONSTRAINT "model_features_tire_model_id_fk" FOREIGN KEY ("tire_model_id") REFERENCES "public"."tire_models"("id") ON DELETE cascade ON UPDATE no action;
    CREATE INDEX "model_features_tire_model_id_idx" ON "model_features" USING btree ("tire_model_id");
    CREATE INDEX "model_features_key_idx" ON "model_features" USING btree ("key");
    CREATE INDEX "model_features_feature_order_idx" ON "model_features" USING btree ("feature_order");
  `);
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP TABLE IF EXISTS "model_features" CASCADE;
    DROP TYPE IF EXISTS "public"."enum_model_features_verification_status";
    DROP TYPE IF EXISTS "public"."enum_model_features_key";
  `);
}
