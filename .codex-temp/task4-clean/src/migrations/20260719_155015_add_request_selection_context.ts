import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TYPE "public"."enum_requests_source_form" ADD VALUE 'tire_selection' BEFORE 'product_quick_order';
  ALTER TABLE "requests" ADD COLUMN "selection_context" jsonb;`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "requests" ALTER COLUMN "source_form" SET DATA TYPE text;
  DROP TYPE "public"."enum_requests_source_form";
  CREATE TYPE "public"."enum_requests_source_form" AS ENUM('contact', 'product_quick_order', 'cart', 'hero_cta', 'footer_cta', 'custom');
  ALTER TABLE "requests" ALTER COLUMN "source_form" SET DATA TYPE "public"."enum_requests_source_form" USING "source_form"::"public"."enum_requests_source_form";
  ALTER TABLE "requests" DROP COLUMN "selection_context";`)
}
