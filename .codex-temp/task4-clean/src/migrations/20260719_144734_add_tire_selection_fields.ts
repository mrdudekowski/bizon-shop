import { type MigrateDownArgs, type MigrateUpArgs, sql } from "@payloadcms/db-postgres";

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    CREATE TYPE "public"."enum_tire_types_selection_vehicle_types" AS ENUM('long-haul-tractor', 'regional-truck', 'construction-dumper', 'quarry-special');
    CREATE TYPE "public"."enum_tire_types_selection_conditions" AS ENUM('long-haul', 'regional', 'mixed', 'off-road');
    CREATE TYPE "public"."enum_tire_models_selection_vehicle_types" AS ENUM('long-haul-tractor', 'regional-truck', 'construction-dumper', 'quarry-special');
    CREATE TYPE "public"."enum_tire_models_selection_conditions" AS ENUM('long-haul', 'regional', 'mixed', 'off-road');
    CREATE TYPE "public"."enum_tire_models_selection_axles" AS ENUM('steer', 'drive', 'trailer');

    CREATE TABLE "tire_types_selection_vehicle_types" (
      "order" integer NOT NULL,
      "parent_id" integer NOT NULL,
      "value" "enum_tire_types_selection_vehicle_types",
      "id" serial PRIMARY KEY NOT NULL
    );
    CREATE TABLE "tire_types_selection_conditions" (
      "order" integer NOT NULL,
      "parent_id" integer NOT NULL,
      "value" "enum_tire_types_selection_conditions",
      "id" serial PRIMARY KEY NOT NULL
    );
    CREATE TABLE "tire_models_selection_vehicle_types" (
      "order" integer NOT NULL,
      "parent_id" integer NOT NULL,
      "value" "enum_tire_models_selection_vehicle_types",
      "id" serial PRIMARY KEY NOT NULL
    );
    CREATE TABLE "tire_models_selection_conditions" (
      "order" integer NOT NULL,
      "parent_id" integer NOT NULL,
      "value" "enum_tire_models_selection_conditions",
      "id" serial PRIMARY KEY NOT NULL
    );
    CREATE TABLE "tire_models_selection_axles" (
      "order" integer NOT NULL,
      "parent_id" integer NOT NULL,
      "value" "enum_tire_models_selection_axles",
      "id" serial PRIMARY KEY NOT NULL
    );

    ALTER TABLE "tire_types_selection_vehicle_types" ADD CONSTRAINT "tire_types_selection_vehicle_types_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."tire_types"("id") ON DELETE cascade ON UPDATE no action;
    ALTER TABLE "tire_types_selection_conditions" ADD CONSTRAINT "tire_types_selection_conditions_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."tire_types"("id") ON DELETE cascade ON UPDATE no action;
    ALTER TABLE "tire_models_selection_vehicle_types" ADD CONSTRAINT "tire_models_selection_vehicle_types_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."tire_models"("id") ON DELETE cascade ON UPDATE no action;
    ALTER TABLE "tire_models_selection_conditions" ADD CONSTRAINT "tire_models_selection_conditions_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."tire_models"("id") ON DELETE cascade ON UPDATE no action;
    ALTER TABLE "tire_models_selection_axles" ADD CONSTRAINT "tire_models_selection_axles_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."tire_models"("id") ON DELETE cascade ON UPDATE no action;

    CREATE INDEX "tire_types_selection_vehicle_types_order_idx" ON "tire_types_selection_vehicle_types" USING btree ("order");
    CREATE INDEX "tire_types_selection_vehicle_types_parent_idx" ON "tire_types_selection_vehicle_types" USING btree ("parent_id");
    CREATE INDEX "tire_types_selection_conditions_order_idx" ON "tire_types_selection_conditions" USING btree ("order");
    CREATE INDEX "tire_types_selection_conditions_parent_idx" ON "tire_types_selection_conditions" USING btree ("parent_id");
    CREATE INDEX "tire_models_selection_vehicle_types_order_idx" ON "tire_models_selection_vehicle_types" USING btree ("order");
    CREATE INDEX "tire_models_selection_vehicle_types_parent_idx" ON "tire_models_selection_vehicle_types" USING btree ("parent_id");
    CREATE INDEX "tire_models_selection_conditions_order_idx" ON "tire_models_selection_conditions" USING btree ("order");
    CREATE INDEX "tire_models_selection_conditions_parent_idx" ON "tire_models_selection_conditions" USING btree ("parent_id");
    CREATE INDEX "tire_models_selection_axles_order_idx" ON "tire_models_selection_axles" USING btree ("order");
    CREATE INDEX "tire_models_selection_axles_parent_idx" ON "tire_models_selection_axles" USING btree ("parent_id");
  `);
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP TABLE "tire_models_selection_axles" CASCADE;
    DROP TABLE "tire_models_selection_conditions" CASCADE;
    DROP TABLE "tire_models_selection_vehicle_types" CASCADE;
    DROP TABLE "tire_types_selection_conditions" CASCADE;
    DROP TABLE "tire_types_selection_vehicle_types" CASCADE;
    DROP TYPE "public"."enum_tire_models_selection_axles";
    DROP TYPE "public"."enum_tire_models_selection_conditions";
    DROP TYPE "public"."enum_tire_models_selection_vehicle_types";
    DROP TYPE "public"."enum_tire_types_selection_conditions";
    DROP TYPE "public"."enum_tire_types_selection_vehicle_types";
  `);
}
