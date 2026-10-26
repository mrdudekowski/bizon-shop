import type { Migration } from "../migrationRunner";

export const productLevelAvailabilityMigration: Migration = {
  version: "202610260020",
  description: "Add model-level availability checkbox to tire_models and wheel_models",
  sql: `
    ALTER TABLE tire_models
      ADD COLUMN IF NOT EXISTS available boolean NOT NULL DEFAULT true;

    ALTER TABLE wheel_models
      ADD COLUMN IF NOT EXISTS available boolean NOT NULL DEFAULT false;

    ALTER TABLE products
      ALTER COLUMN available SET DEFAULT true;

    UPDATE products
    SET available = true
    WHERE available IS NULL;
  `,
};
