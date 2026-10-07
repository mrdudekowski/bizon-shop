import type { Migration } from "../migrationRunner";

export const shopCategoryCarouselMigration: Migration = {
  version: "202610030002",
  description: "Shop landing-page category carousel images",
  sql: `
    CREATE TABLE IF NOT EXISTS shop_category_carousel (
      id serial PRIMARY KEY,
      shop_category_id integer NOT NULL,
      sort_order integer NOT NULL,
      title text NOT NULL DEFAULT '',
      image_id integer
    );
  `,
};
