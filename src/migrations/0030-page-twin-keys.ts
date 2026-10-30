import type { Migration } from "../migrationRunner";

/**
 * pages.key is the enum enum_pages_key. Postgres cannot use a new enum value in the transaction that added it,
 * and the runner wraps each migration in one transaction, so 0031 holds the rows that use these values.
 */
export const pageTwinEnumValueMigration: Migration = {
  version: "202610300030",
  description: "Add service and shop page twin values to the pages key enum",
  sql: `
    ALTER TYPE enum_pages_key ADD VALUE IF NOT EXISTS 'delivery';
    ALTER TYPE enum_pages_key ADD VALUE IF NOT EXISTS 'payment';
    ALTER TYPE enum_pages_key ADD VALUE IF NOT EXISTS 'shop-delivery';
    ALTER TYPE enum_pages_key ADD VALUE IF NOT EXISTS 'shop-payment';
    ALTER TYPE enum_pages_key ADD VALUE IF NOT EXISTS 'shop-warranty';
    ALTER TYPE enum_pages_key ADD VALUE IF NOT EXISTS 'shop-become-a-supplier';
  `,
};
