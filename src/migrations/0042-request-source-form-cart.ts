import type { Migration } from "../migrationRunner";

/**
 * The public request forms already emit these source labels. Add them in a
 * standalone migration so PostgreSQL commits the enum values before requests
 * using them are inserted.
 */
export const requestSourceFormCartMigration: Migration = {
  version: "202611230002",
  description: "Allow procurement and cart request source forms",
  sql: `
    ALTER TYPE enum_requests_source_form ADD VALUE IF NOT EXISTS 'procurement';
    ALTER TYPE enum_requests_source_form ADD VALUE IF NOT EXISTS 'tire_cart';
    ALTER TYPE enum_requests_source_form ADD VALUE IF NOT EXISTS 'shop_cart';
  `,
};
