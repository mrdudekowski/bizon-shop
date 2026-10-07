import type { Migration } from "../migrationRunner";

export const shopSubcategoriesMigration: Migration = {
  version: "202610030003",
  description: "Shop product subcategories",
  sql: `
    CREATE TABLE IF NOT EXISTS shop_subcategories (
      id serial PRIMARY KEY,
      category_id integer NOT NULL REFERENCES shop_categories(id) ON DELETE RESTRICT,
      name text NOT NULL,
      slug text NOT NULL,
      sort_order integer NOT NULL DEFAULT 0,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    );
    ALTER TABLE shop_subcategories
      ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now(),
      ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();
    CREATE UNIQUE INDEX IF NOT EXISTS shop_subcategories_category_slug_unique
      ON shop_subcategories (category_id, lower(slug));
    CREATE UNIQUE INDEX IF NOT EXISTS shop_subcategories_category_name_unique
      ON shop_subcategories (category_id, lower(name));
    DO $$
    BEGIN
      IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'shop_subcategory_id'
      ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'subcategory_id'
      ) THEN
        ALTER TABLE products RENAME COLUMN shop_subcategory_id TO subcategory_id;
      ELSIF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'subcategory_id'
      ) THEN
        ALTER TABLE products
          ADD COLUMN subcategory_id integer REFERENCES shop_subcategories(id) ON DELETE RESTRICT;
      ELSIF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'shop_subcategory_id'
      ) THEN
        RAISE EXCEPTION 'Both legacy and canonical product subcategory columns exist; reconcile them before migrating';
      END IF;
    END $$;
    CREATE INDEX IF NOT EXISTS products_subcategory_id_idx ON products (subcategory_id);
  `,
};
