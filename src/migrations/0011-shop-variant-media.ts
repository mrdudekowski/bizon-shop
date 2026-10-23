import type { Migration } from "../migrationRunner";

export const shopVariantMediaMigration: Migration = {
  version: "202610220011",
  description: "Media placement for Shop product variants",
  sql: `
    CREATE TABLE IF NOT EXISTS products_variants_rels (
      id serial PRIMARY KEY,
      "order" integer NOT NULL DEFAULT 0,
      parent_id varchar NOT NULL REFERENCES products_variants(id) ON DELETE CASCADE,
      path varchar NOT NULL DEFAULT 'image',
      media_id integer NOT NULL REFERENCES media(id) ON DELETE CASCADE,
      alt text NOT NULL DEFAULT '',
      focal_x double precision NOT NULL DEFAULT 0.5,
      focal_y double precision NOT NULL DEFAULT 0.5,
      crop_x double precision NOT NULL DEFAULT 0,
      crop_y double precision NOT NULL DEFAULT 0,
      crop_width double precision NOT NULL DEFAULT 1,
      crop_height double precision NOT NULL DEFAULT 1,
      CONSTRAINT products_variants_rels_one_image_per_variant UNIQUE (parent_id, path)
    );
    CREATE INDEX IF NOT EXISTS products_variants_rels_media_id_idx
      ON products_variants_rels (media_id);
  `,
};
