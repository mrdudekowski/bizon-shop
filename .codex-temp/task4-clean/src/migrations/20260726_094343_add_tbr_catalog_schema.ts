import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_tire_models_positions" AS ENUM('steer', 'drive', 'trailer');
  CREATE TYPE "public"."enum_tire_models_application_types" AS ENUM('long-haul', 'regional', 'urban', 'off-road', 'winter', 'snow-mud');
  CREATE TYPE "public"."enum_tire_models_features_key" AS ENUM('handling', 'safety', 'high-mileage', 'economy', 'wet-grip', 'anti-wear', 'anti-tear', 'short-braking-distance', 'low-noise', 'heavy-load', 'self-cleaning', 'retreadability', 'stone-ejection', 'low-rolling-resistance', 'heat-dissipation', 'cut-resistance', 'puncture-resistance');
  CREATE TYPE "public"."enum_tire_models_features_verification_status" AS ENUM('sourceOnly', 'needsReview', 'verified');
  CREATE TYPE "public"."enum_tire_models_validation_warnings_severity" AS ENUM('warning', 'critical');
  CREATE TYPE "public"."enum_tire_models_verification_status" AS ENUM('imported', 'needsReview', 'verified', 'rejected');
  CREATE TYPE "public"."enum_tire_variants_validation_warnings_severity" AS ENUM('warning', 'critical');
  CREATE TYPE "public"."enum_tire_variants_size_format" AS ENUM('metric', 'imperial');
  CREATE TYPE "public"."enum_tire_variants_construction_code" AS ENUM('R');
  CREATE TYPE "public"."enum_tire_variants_speed_symbol" AS ENUM('B', 'F', 'G', 'J', 'K', 'L', 'M');
  CREATE TYPE "public"."enum_tire_variants_availability_status" AS ENUM('available', 'on_request', 'unavailable');
  CREATE TYPE "public"."enum_tire_variants_verification_status" AS ENUM('imported', 'needsReview', 'verified', 'rejected');
  CREATE TABLE "tire_models_positions" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum_tire_models_positions",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "tire_models_application_types" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum_tire_models_application_types",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "tire_models_features" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"key" "enum_tire_models_features_key" NOT NULL,
  	"title" varchar NOT NULL,
  	"description" varchar,
  	"source_text" varchar,
  	"verification_status" "enum_tire_models_features_verification_status" DEFAULT 'sourceOnly'
  );
  
  CREATE TABLE "tire_models_validation_warnings" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"code" varchar NOT NULL,
  	"severity" "enum_tire_models_validation_warnings_severity" NOT NULL,
  	"field" varchar,
  	"message" varchar NOT NULL
  );
  
  CREATE TABLE "tire_variants_validation_warnings" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"code" varchar NOT NULL,
  	"severity" "enum_tire_variants_validation_warnings_severity" NOT NULL,
  	"field" varchar,
  	"message" varchar NOT NULL
  );
  
  ALTER TABLE "tire_models" ALTER COLUMN "application_category" DROP NOT NULL;
  ALTER TABLE "tire_variants" ALTER COLUMN "size" DROP NOT NULL;
  ALTER TABLE "tire_variants" ALTER COLUMN "available" DROP DEFAULT;
  ALTER TABLE "tire_variants" ALTER COLUMN "price_on_request" DROP DEFAULT;
  ALTER TABLE "tire_models" ADD COLUMN "catalog_id" varchar;
  ALTER TABLE "tire_models" ADD COLUMN "model_code" varchar;
  ALTER TABLE "tire_models" ADD COLUMN "tread_image_id" integer;
  ALTER TABLE "tire_models" ADD COLUMN "position_diagram_id" integer;
  ALTER TABLE "tire_models" ADD COLUMN "verification_status" "enum_tire_models_verification_status" DEFAULT 'imported';
  ALTER TABLE "tire_models" ADD COLUMN "source_snapshot_source_document" varchar;
  ALTER TABLE "tire_models" ADD COLUMN "source_snapshot_source_sheet" varchar;
  ALTER TABLE "tire_models" ADD COLUMN "source_snapshot_source_page" numeric;
  ALTER TABLE "tire_models" ADD COLUMN "source_snapshot_source_row_number" numeric;
  ALTER TABLE "tire_models" ADD COLUMN "source_snapshot_source_data_raw" jsonb;
  ALTER TABLE "tire_models" ADD COLUMN "source_snapshot_source_unit_labels" jsonb;
  ALTER TABLE "tire_models" ADD COLUMN "source_snapshot_imported_at" timestamp(3) with time zone;
  ALTER TABLE "tire_models" ADD COLUMN "source_snapshot_import_batch_id" varchar;
  ALTER TABLE "tire_variants" ADD COLUMN "catalog_id" varchar;
  ALTER TABLE "tire_variants" ADD COLUMN "sku" varchar;
  ALTER TABLE "tire_variants" ADD COLUMN "supplier_sku" varchar;
  ALTER TABLE "tire_variants" ADD COLUMN "size_raw" varchar;
  ALTER TABLE "tire_variants" ADD COLUMN "size_normalized" varchar;
  ALTER TABLE "tire_variants" ADD COLUMN "size_format" "enum_tire_variants_size_format";
  ALTER TABLE "tire_variants" ADD COLUMN "nominal_width_mm" numeric;
  ALTER TABLE "tire_variants" ADD COLUMN "imperial_width_in" numeric;
  ALTER TABLE "tire_variants" ADD COLUMN "aspect_ratio_pct" numeric;
  ALTER TABLE "tire_variants" ADD COLUMN "construction_code" "enum_tire_variants_construction_code";
  ALTER TABLE "tire_variants" ADD COLUMN "rim_diameter_in" numeric;
  ALTER TABLE "tire_variants" ADD COLUMN "ply_rating_pr" numeric;
  ALTER TABLE "tire_variants" ADD COLUMN "tread_depth_mm" numeric;
  ALTER TABLE "tire_variants" ADD COLUMN "standard_rim_in" numeric;
  ALTER TABLE "tire_variants" ADD COLUMN "pressure_single_kpa" numeric;
  ALTER TABLE "tire_variants" ADD COLUMN "pressure_dual_kpa" numeric;
  ALTER TABLE "tire_variants" ADD COLUMN "max_load_single_kg" numeric;
  ALTER TABLE "tire_variants" ADD COLUMN "max_load_dual_kg" numeric;
  ALTER TABLE "tire_variants" ADD COLUMN "load_index_single" numeric;
  ALTER TABLE "tire_variants" ADD COLUMN "load_index_dual" numeric;
  ALTER TABLE "tire_variants" ADD COLUMN "speed_symbol" "enum_tire_variants_speed_symbol";
  ALTER TABLE "tire_variants" ADD COLUMN "overall_diameter_mm" numeric;
  ALTER TABLE "tire_variants" ADD COLUMN "section_width_mm" numeric;
  ALTER TABLE "tire_variants" ADD COLUMN "availability_status" "enum_tire_variants_availability_status" DEFAULT 'on_request';
  ALTER TABLE "tire_variants" ADD COLUMN "verification_status" "enum_tire_variants_verification_status" DEFAULT 'imported';
  ALTER TABLE "tire_variants" ADD COLUMN "publish_blocked" boolean DEFAULT false;
  ALTER TABLE "tire_variants" ADD COLUMN "source_snapshot_source_document" varchar;
  ALTER TABLE "tire_variants" ADD COLUMN "source_snapshot_source_sheet" varchar;
  ALTER TABLE "tire_variants" ADD COLUMN "source_snapshot_source_page" numeric;
  ALTER TABLE "tire_variants" ADD COLUMN "source_snapshot_source_row_number" numeric;
  ALTER TABLE "tire_variants" ADD COLUMN "source_snapshot_source_data_raw" jsonb;
  ALTER TABLE "tire_variants" ADD COLUMN "source_snapshot_source_unit_labels" jsonb;
  ALTER TABLE "tire_variants" ADD COLUMN "source_snapshot_imported_at" timestamp(3) with time zone;
  ALTER TABLE "tire_variants" ADD COLUMN "source_snapshot_import_batch_id" varchar;
  ALTER TABLE "tire_models_positions" ADD CONSTRAINT "tire_models_positions_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."tire_models"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "tire_models_application_types" ADD CONSTRAINT "tire_models_application_types_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."tire_models"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "tire_models_features" ADD CONSTRAINT "tire_models_features_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."tire_models"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "tire_models_validation_warnings" ADD CONSTRAINT "tire_models_validation_warnings_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."tire_models"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "tire_variants_validation_warnings" ADD CONSTRAINT "tire_variants_validation_warnings_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."tire_variants"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "tire_models_positions_order_idx" ON "tire_models_positions" USING btree ("order");
  CREATE INDEX "tire_models_positions_parent_idx" ON "tire_models_positions" USING btree ("parent_id");
  CREATE INDEX "tire_models_application_types_order_idx" ON "tire_models_application_types" USING btree ("order");
  CREATE INDEX "tire_models_application_types_parent_idx" ON "tire_models_application_types" USING btree ("parent_id");
  CREATE INDEX "tire_models_features_order_idx" ON "tire_models_features" USING btree ("_order");
  CREATE INDEX "tire_models_features_parent_id_idx" ON "tire_models_features" USING btree ("_parent_id");
  CREATE INDEX "tire_models_validation_warnings_order_idx" ON "tire_models_validation_warnings" USING btree ("_order");
  CREATE INDEX "tire_models_validation_warnings_parent_id_idx" ON "tire_models_validation_warnings" USING btree ("_parent_id");
  CREATE INDEX "tire_variants_validation_warnings_order_idx" ON "tire_variants_validation_warnings" USING btree ("_order");
  CREATE INDEX "tire_variants_validation_warnings_parent_id_idx" ON "tire_variants_validation_warnings" USING btree ("_parent_id");
  ALTER TABLE "tire_models" ADD CONSTRAINT "tire_models_tread_image_id_media_id_fk" FOREIGN KEY ("tread_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "tire_models" ADD CONSTRAINT "tire_models_position_diagram_id_media_id_fk" FOREIGN KEY ("position_diagram_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE UNIQUE INDEX "tire_models_catalog_id_idx" ON "tire_models" USING btree ("catalog_id");
  CREATE UNIQUE INDEX "tire_models_model_code_idx" ON "tire_models" USING btree ("model_code");
  CREATE INDEX "tire_models_tread_image_idx" ON "tire_models" USING btree ("tread_image_id");
  CREATE INDEX "tire_models_position_diagram_idx" ON "tire_models" USING btree ("position_diagram_id");
  CREATE UNIQUE INDEX "tire_variants_catalog_id_idx" ON "tire_variants" USING btree ("catalog_id");
  CREATE UNIQUE INDEX "tire_variants_sku_idx" ON "tire_variants" USING btree ("sku");
  CREATE INDEX "tire_variants_size_normalized_idx" ON "tire_variants" USING btree ("size_normalized");
  CREATE INDEX "tire_variants_nominal_width_mm_idx" ON "tire_variants" USING btree ("nominal_width_mm");
  CREATE INDEX "tire_variants_imperial_width_in_idx" ON "tire_variants" USING btree ("imperial_width_in");
  CREATE INDEX "tire_variants_aspect_ratio_pct_idx" ON "tire_variants" USING btree ("aspect_ratio_pct");
  CREATE INDEX "tire_variants_rim_diameter_in_idx" ON "tire_variants" USING btree ("rim_diameter_in");
  CREATE INDEX "tire_variants_ply_rating_pr_idx" ON "tire_variants" USING btree ("ply_rating_pr");
  CREATE INDEX "tire_variants_max_load_single_kg_idx" ON "tire_variants" USING btree ("max_load_single_kg");
  CREATE INDEX "tire_variants_load_index_single_idx" ON "tire_variants" USING btree ("load_index_single");
  CREATE INDEX "tire_variants_speed_symbol_idx" ON "tire_variants" USING btree ("speed_symbol");
  CREATE UNIQUE INDEX "tire_variants_model_size_pr_idx" ON "tire_variants" USING btree ("tire_model_id", "size_normalized", "ply_rating_pr");`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "tire_models_positions" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "tire_models_application_types" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "tire_models_features" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "tire_models_validation_warnings" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "tire_variants_validation_warnings" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "tire_models_positions" CASCADE;
  DROP TABLE "tire_models_application_types" CASCADE;
  DROP TABLE "tire_models_features" CASCADE;
  DROP TABLE "tire_models_validation_warnings" CASCADE;
  DROP TABLE "tire_variants_validation_warnings" CASCADE;
  ALTER TABLE "tire_models" DROP CONSTRAINT "tire_models_tread_image_id_media_id_fk";
  
  ALTER TABLE "tire_models" DROP CONSTRAINT "tire_models_position_diagram_id_media_id_fk";
  
  DROP INDEX "tire_models_catalog_id_idx";
  DROP INDEX "tire_models_model_code_idx";
  DROP INDEX "tire_models_tread_image_idx";
  DROP INDEX "tire_models_position_diagram_idx";
  DROP INDEX "tire_variants_catalog_id_idx";
  DROP INDEX "tire_variants_sku_idx";
  DROP INDEX "tire_variants_size_normalized_idx";
  DROP INDEX "tire_variants_nominal_width_mm_idx";
  DROP INDEX "tire_variants_imperial_width_in_idx";
  DROP INDEX "tire_variants_aspect_ratio_pct_idx";
  DROP INDEX "tire_variants_rim_diameter_in_idx";
  DROP INDEX "tire_variants_ply_rating_pr_idx";
  DROP INDEX "tire_variants_max_load_single_kg_idx";
  DROP INDEX "tire_variants_load_index_single_idx";
  DROP INDEX "tire_variants_speed_symbol_idx";
  DROP INDEX IF EXISTS "tire_variants_model_size_pr_idx";
  ALTER TABLE "tire_models" ALTER COLUMN "application_category" SET NOT NULL;
  ALTER TABLE "tire_variants" ALTER COLUMN "size" SET NOT NULL;
  ALTER TABLE "tire_variants" ALTER COLUMN "available" SET DEFAULT true;
  ALTER TABLE "tire_variants" ALTER COLUMN "price_on_request" SET DEFAULT true;
  ALTER TABLE "tire_models" DROP COLUMN "catalog_id";
  ALTER TABLE "tire_models" DROP COLUMN "model_code";
  ALTER TABLE "tire_models" DROP COLUMN "tread_image_id";
  ALTER TABLE "tire_models" DROP COLUMN "position_diagram_id";
  ALTER TABLE "tire_models" DROP COLUMN "verification_status";
  ALTER TABLE "tire_models" DROP COLUMN "source_snapshot_source_document";
  ALTER TABLE "tire_models" DROP COLUMN "source_snapshot_source_sheet";
  ALTER TABLE "tire_models" DROP COLUMN "source_snapshot_source_page";
  ALTER TABLE "tire_models" DROP COLUMN "source_snapshot_source_row_number";
  ALTER TABLE "tire_models" DROP COLUMN "source_snapshot_source_data_raw";
  ALTER TABLE "tire_models" DROP COLUMN "source_snapshot_source_unit_labels";
  ALTER TABLE "tire_models" DROP COLUMN "source_snapshot_imported_at";
  ALTER TABLE "tire_models" DROP COLUMN "source_snapshot_import_batch_id";
  ALTER TABLE "tire_variants" DROP COLUMN "catalog_id";
  ALTER TABLE "tire_variants" DROP COLUMN "sku";
  ALTER TABLE "tire_variants" DROP COLUMN "supplier_sku";
  ALTER TABLE "tire_variants" DROP COLUMN "size_raw";
  ALTER TABLE "tire_variants" DROP COLUMN "size_normalized";
  ALTER TABLE "tire_variants" DROP COLUMN "size_format";
  ALTER TABLE "tire_variants" DROP COLUMN "nominal_width_mm";
  ALTER TABLE "tire_variants" DROP COLUMN "imperial_width_in";
  ALTER TABLE "tire_variants" DROP COLUMN "aspect_ratio_pct";
  ALTER TABLE "tire_variants" DROP COLUMN "construction_code";
  ALTER TABLE "tire_variants" DROP COLUMN "rim_diameter_in";
  ALTER TABLE "tire_variants" DROP COLUMN "ply_rating_pr";
  ALTER TABLE "tire_variants" DROP COLUMN "tread_depth_mm";
  ALTER TABLE "tire_variants" DROP COLUMN "standard_rim_in";
  ALTER TABLE "tire_variants" DROP COLUMN "pressure_single_kpa";
  ALTER TABLE "tire_variants" DROP COLUMN "pressure_dual_kpa";
  ALTER TABLE "tire_variants" DROP COLUMN "max_load_single_kg";
  ALTER TABLE "tire_variants" DROP COLUMN "max_load_dual_kg";
  ALTER TABLE "tire_variants" DROP COLUMN "load_index_single";
  ALTER TABLE "tire_variants" DROP COLUMN "load_index_dual";
  ALTER TABLE "tire_variants" DROP COLUMN "speed_symbol";
  ALTER TABLE "tire_variants" DROP COLUMN "overall_diameter_mm";
  ALTER TABLE "tire_variants" DROP COLUMN "section_width_mm";
  ALTER TABLE "tire_variants" DROP COLUMN "availability_status";
  ALTER TABLE "tire_variants" DROP COLUMN "verification_status";
  ALTER TABLE "tire_variants" DROP COLUMN "publish_blocked";
  ALTER TABLE "tire_variants" DROP COLUMN "source_snapshot_source_document";
  ALTER TABLE "tire_variants" DROP COLUMN "source_snapshot_source_sheet";
  ALTER TABLE "tire_variants" DROP COLUMN "source_snapshot_source_page";
  ALTER TABLE "tire_variants" DROP COLUMN "source_snapshot_source_row_number";
  ALTER TABLE "tire_variants" DROP COLUMN "source_snapshot_source_data_raw";
  ALTER TABLE "tire_variants" DROP COLUMN "source_snapshot_source_unit_labels";
  ALTER TABLE "tire_variants" DROP COLUMN "source_snapshot_imported_at";
  ALTER TABLE "tire_variants" DROP COLUMN "source_snapshot_import_batch_id";
  DROP TYPE "public"."enum_tire_models_positions";
  DROP TYPE "public"."enum_tire_models_application_types";
  DROP TYPE "public"."enum_tire_models_features_key";
  DROP TYPE "public"."enum_tire_models_features_verification_status";
  DROP TYPE "public"."enum_tire_models_validation_warnings_severity";
  DROP TYPE "public"."enum_tire_models_verification_status";
  DROP TYPE "public"."enum_tire_variants_validation_warnings_severity";
  DROP TYPE "public"."enum_tire_variants_size_format";
  DROP TYPE "public"."enum_tire_variants_construction_code";
  DROP TYPE "public"."enum_tire_variants_speed_symbol";
  DROP TYPE "public"."enum_tire_variants_availability_status";
  DROP TYPE "public"."enum_tire_variants_verification_status";`)
}
