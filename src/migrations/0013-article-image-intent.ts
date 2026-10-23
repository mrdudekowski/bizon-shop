import type { Migration } from "../migrationRunner";

export const articleImageIntentMigration: Migration = {
  version: "202610220013",
  description: "Distinguish legacy Tire IQ covers from explicitly cleared article images",
  sql: `
    ALTER TABLE tire_iq_articles
      ADD COLUMN IF NOT EXISTS featured_image_configured boolean NOT NULL DEFAULT false;
  `,
};
