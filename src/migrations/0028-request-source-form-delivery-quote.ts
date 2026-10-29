import type { Migration } from "../migrationRunner";

/**
 * requests.source_form is enum_requests_source_form. delivery_quote is not one of the original labels,
 * so an insert of a geography request fails until this value exists. The runner commits this statement
 * before any request uses it.
 */
export const requestSourceFormDeliveryQuoteMigration: Migration = {
  version: "202610300028",
  description: "Allow delivery_quote as a request source form",
  sql: `
    ALTER TYPE enum_requests_source_form ADD VALUE IF NOT EXISTS 'delivery_quote';
  `,
};
