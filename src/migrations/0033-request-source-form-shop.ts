import type { Migration } from "../migrationRunner";

/**
 * requests.source_form is enum_requests_source_form. Postgres cannot use a new enum value
 * in the transaction that added it, and the runner wraps each migration in one transaction.
 * Shop request inserts use these values only after this migration commits.
 */
export const requestSourceFormShopMigration: Migration = {
  version: "202610300033",
  description: "Allow shop delivery, warranty, and supplier request source forms",
  sql: `
    ALTER TYPE enum_requests_source_form ADD VALUE IF NOT EXISTS 'shop_delivery';
    ALTER TYPE enum_requests_source_form ADD VALUE IF NOT EXISTS 'shop_warranty';
    ALTER TYPE enum_requests_source_form ADD VALUE IF NOT EXISTS 'shop_supplier';
  `,
};
