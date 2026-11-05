import type { Migration } from "../migrationRunner";

/** Existing published contacts keep the request forms until an editor publishes card mode. */
export const contactSurfaceMigration: Migration = {
  version: "202611050037",
  description: "Store whether published contacts replace request forms with a contact card",
  sql: `
    ALTER TABLE site_profile ADD COLUMN IF NOT EXISTS contact_surface text NOT NULL DEFAULT 'form';
  `,
};
