import type { Migration } from "../migrationRunner";

export const imageFocalPositionsMigration: Migration = {
  version: "202610250018",
  description: "Persist focal positions for published CMS image placements",
  sql: `
    CREATE TABLE IF NOT EXISTS cms_image_focal_positions (
      collection text NOT NULL,
      doc_id text NOT NULL,
      placement_path text NOT NULL,
      media_id integer NOT NULL REFERENCES media(id) ON DELETE CASCADE,
      focal_x double precision NOT NULL DEFAULT 0.5 CHECK (focal_x >= 0 AND focal_x <= 1),
      focal_y double precision NOT NULL DEFAULT 0.5 CHECK (focal_y >= 0 AND focal_y <= 1),
      PRIMARY KEY (collection, doc_id, placement_path)
    );
    CREATE INDEX IF NOT EXISTS cms_image_focal_positions_media_id_idx
      ON cms_image_focal_positions (media_id);
  `,
};
