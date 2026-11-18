import type { Migration } from "../migrationRunner";

export const articleImageAltMigration: Migration = {
  version: "202611180040",
  description: "Store per-article featured image alt text",
  sql: `
    ALTER TABLE tire_iq_articles
      ADD COLUMN IF NOT EXISTS featured_image_alt text;
  `,
};
