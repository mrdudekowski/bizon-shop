import type { Migration } from "../migrationRunner";
export const pageEditorialContentMigration: Migration = {
 version: "202610130010",
 description: "Typed service and delivery page editorial content",
 sql: `
 ALTER TABLE pages
 ADD COLUMN IF NOT EXISTS editorial_configured boolean NOT NULL DEFAULT false,
 ADD COLUMN IF NOT EXISTS editorial_heading_configured boolean NOT NULL DEFAULT false,
 ADD COLUMN IF NOT EXISTS editorial_features_configured boolean NOT NULL DEFAULT false,
 ADD COLUMN IF NOT EXISTS editorial_sections_configured boolean NOT NULL DEFAULT false,
 ADD COLUMN IF NOT EXISTS editorial_notice_configured boolean NOT NULL DEFAULT false,
 ADD COLUMN IF NOT EXISTS editorial_proof_configured boolean NOT NULL DEFAULT false,
 ADD COLUMN IF NOT EXISTS editorial_cta_configured boolean NOT NULL DEFAULT false,
 ADD COLUMN IF NOT EXISTS editorial_features_heading text NOT NULL DEFAULT '',
 ADD COLUMN IF NOT EXISTS editorial_notice text NOT NULL DEFAULT '',
 ADD COLUMN IF NOT EXISTS editorial_proof_title text NOT NULL DEFAULT '',
 ADD COLUMN IF NOT EXISTS editorial_proof_text text NOT NULL DEFAULT '',
 ADD COLUMN IF NOT EXISTS editorial_proof_image_id integer REFERENCES media(id) ON DELETE SET NULL,
 ADD COLUMN IF NOT EXISTS editorial_proof_image_alt text NOT NULL DEFAULT '',
 ADD COLUMN IF NOT EXISTS editorial_cta_label text NOT NULL DEFAULT '',
 ADD COLUMN IF NOT EXISTS editorial_cta_href text NOT NULL DEFAULT '',
 ADD COLUMN IF NOT EXISTS editorial_secondary_label text NOT NULL DEFAULT '',
 ADD COLUMN IF NOT EXISTS editorial_secondary_href text NOT NULL DEFAULT '';
 CREATE TABLE IF NOT EXISTS pages_editorial_features (
 id text NOT NULL, _parent_id integer NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
 _order integer NOT NULL, title text NOT NULL DEFAULT '', text text NOT NULL DEFAULT '', PRIMARY KEY (_parent_id, id));
 CREATE TABLE IF NOT EXISTS pages_editorial_sections (
 id text NOT NULL, _parent_id integer NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
 _order integer NOT NULL, heading text NOT NULL DEFAULT '', body text NOT NULL DEFAULT '', PRIMARY KEY (_parent_id, id));
 `,
};

