import type { Migration } from "../migrationRunner";

export const cmsDocumentLinksMigration: Migration = {
  version: "202610220012",
  description: "Reusable published PDF links for CMS pages and catalog models",
  sql: `
    CREATE TABLE IF NOT EXISTS cms_document_links (
      id serial PRIMARY KEY,
      entity_type varchar NOT NULL CHECK (entity_type IN ('page', 'tire-model', 'wheel-model')),
      entity_id varchar NOT NULL,
      media_id integer NOT NULL REFERENCES media(id) ON DELETE CASCADE,
      title text NOT NULL DEFAULT '',
      sort_order integer NOT NULL DEFAULT 0,
      CONSTRAINT cms_document_links_unique_asset UNIQUE (entity_type, entity_id, media_id)
    );
    CREATE INDEX IF NOT EXISTS cms_document_links_owner_idx
      ON cms_document_links (entity_type, entity_id, sort_order, id);
    CREATE INDEX IF NOT EXISTS cms_document_links_media_idx
      ON cms_document_links (media_id);
  `,
};
