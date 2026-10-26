import type { Migration } from "../migrationRunner";

export const shopProductSpecsAndSortOrderMigration: Migration = {
  version: "202610260021",
  description: "Add SKU, brand, sort_order, and specifications JSONB to products table",
  sql: `
    ALTER TABLE products
      ADD COLUMN IF NOT EXISTS sku varchar,
      ADD COLUMN IF NOT EXISTS brand varchar,
      ADD COLUMN IF NOT EXISTS sort_order integer NOT NULL DEFAULT 0,
      ADD COLUMN IF NOT EXISTS specifications jsonb NOT NULL DEFAULT '[]'::jsonb;
  `,
};
