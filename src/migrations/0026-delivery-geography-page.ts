import type { Migration } from "../migrationRunner";

/**
 * pages.key is the enum enum_pages_key. Postgres cannot use a new enum value in the transaction that added it,
 * and the runner wraps each migration in one transaction, so 0027 holds the rows that use this value.
 */
export const deliveryGeographyEnumValueMigration: Migration = {
  version: "202610300026",
  description: "Add the delivery-geography value to the pages key enum",
  sql: `
    ALTER TYPE enum_pages_key ADD VALUE IF NOT EXISTS 'delivery-geography';
  `,
};
