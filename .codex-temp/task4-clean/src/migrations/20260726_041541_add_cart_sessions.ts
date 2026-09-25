import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TYPE "public"."enum_requests_source_form" ADD VALUE 'branding' BEFORE 'product_quick_order';
  ALTER TYPE "public"."enum_requests_source_form" ADD VALUE 'supplier' BEFORE 'product_quick_order';
  ALTER TYPE "public"."enum_requests_source_form" ADD VALUE 'warranty' BEFORE 'product_quick_order';
  ALTER TYPE "public"."enum_requests_source_form" ADD VALUE 'wheel_selection' BEFORE 'product_quick_order';
  CREATE TABLE "cart_sessions" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"token_hash" varchar NOT NULL,
  	"items" jsonb DEFAULT '[]'::jsonb NOT NULL,
  	"expires_at" timestamp(3) with time zone NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "cart_sessions_id" integer;
  CREATE UNIQUE INDEX "cart_sessions_token_hash_idx" ON "cart_sessions" USING btree ("token_hash");
  CREATE INDEX "cart_sessions_expires_at_idx" ON "cart_sessions" USING btree ("expires_at");
  CREATE INDEX "cart_sessions_updated_at_idx" ON "cart_sessions" USING btree ("updated_at");
  CREATE INDEX "cart_sessions_created_at_idx" ON "cart_sessions" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_cart_sessions_fk" FOREIGN KEY ("cart_sessions_id") REFERENCES "public"."cart_sessions"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_cart_sessions_id_idx" ON "payload_locked_documents_rels" USING btree ("cart_sessions_id");`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_cart_sessions_fk";
  DROP INDEX "payload_locked_documents_rels_cart_sessions_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "cart_sessions_id";
  ALTER TABLE "cart_sessions" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "cart_sessions" CASCADE;
  
  ALTER TABLE "requests" ALTER COLUMN "source_form" SET DATA TYPE text;
  DROP TYPE "public"."enum_requests_source_form";
  CREATE TYPE "public"."enum_requests_source_form" AS ENUM('contact', 'tire_selection', 'product_quick_order', 'cart', 'hero_cta', 'footer_cta', 'custom');
  ALTER TABLE "requests" ALTER COLUMN "source_form" SET DATA TYPE "public"."enum_requests_source_form" USING "source_form"::"public"."enum_requests_source_form";`)
}
