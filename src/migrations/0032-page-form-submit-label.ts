import type { Migration } from "../migrationRunner";

/** Null leaves the public submit button as «Отправить». A later save writes the column. */
export const pageFormSubmitLabelMigration: Migration = {
  version: "202610300032",
  description: "Add an optional submit label to page forms",
  sql: `
    ALTER TABLE page_forms ADD COLUMN IF NOT EXISTS submit_label text NULL;
  `,
};
