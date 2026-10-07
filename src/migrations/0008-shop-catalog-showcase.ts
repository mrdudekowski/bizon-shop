import type { Migration } from "../migrationRunner";

export const shopCatalogShowcaseMigration: Migration = {
  version: "202610070008",
  description: "Shop catalog page copy and category tile presentation",
  sql: `
    ALTER TABLE pages
      ADD COLUMN IF NOT EXISTS shop_catalog_eyebrow text NOT NULL DEFAULT 'BIZON Shop',
      ADD COLUMN IF NOT EXISTS shop_catalog_title text NOT NULL DEFAULT 'Движение продолжается вне автомобиля',
      ADD COLUMN IF NOT EXISTS shop_catalog_lead text NOT NULL DEFAULT 'Категории BIZON Shop — диски отдельно, товары по направлениям.',
      ADD COLUMN IF NOT EXISTS shop_catalog_section_title text NOT NULL DEFAULT 'Выберите направление';

    CREATE TABLE IF NOT EXISTS pages_shop_catalog_tiles (
      id serial PRIMARY KEY,
      _parent_id integer NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
      category_id integer NOT NULL REFERENCES shop_categories(id) ON DELETE CASCADE,
      _order integer NOT NULL DEFAULT 0,
      title text NOT NULL DEFAULT '',
      visible boolean NOT NULL DEFAULT true,
      icon_media_id integer REFERENCES media(id) ON DELETE SET NULL,
      image_media_id integer REFERENCES media(id) ON DELETE SET NULL,
      carousel_image_media_id integer REFERENCES media(id) ON DELETE SET NULL,
      carousel_visible boolean NOT NULL DEFAULT true,
      icon_alt text NOT NULL DEFAULT '',
      image_alt text NOT NULL DEFAULT '',
      carousel_image_alt text NOT NULL DEFAULT '',
      UNIQUE (_parent_id, category_id)
    );
    CREATE INDEX IF NOT EXISTS pages_shop_catalog_tiles_order_idx
      ON pages_shop_catalog_tiles (_parent_id, _order, id);

    INSERT INTO pages_shop_catalog_tiles (
      _parent_id, category_id, _order, title, visible,
      icon_media_id, image_media_id, carousel_image_media_id, carousel_visible,
      icon_alt, image_alt, carousel_image_alt
    )
    SELECT
      pages.id,
      shop_categories.id,
      ROW_NUMBER() OVER (PARTITION BY pages.id ORDER BY shop_categories.sort_order, shop_categories.id) - 1,
      shop_categories.name,
      shop_categories.show_in_menu,
      shop_categories.cover_image_id,
      shop_categories.cover_image_id,
      (SELECT carousel.image_id FROM shop_category_carousel AS carousel
       WHERE carousel.shop_category_id = shop_categories.id ORDER BY carousel.sort_order, carousel.id LIMIT 1),
      (SELECT COUNT(*) > 0 FROM shop_category_carousel AS carousel WHERE carousel.shop_category_id = shop_categories.id),
      shop_categories.name,
      shop_categories.name,
      shop_categories.name
    FROM pages
    CROSS JOIN shop_categories
    WHERE pages.key = 'shop-home' AND shop_categories.status = 'published'
    ON CONFLICT (_parent_id, category_id) DO NOTHING;
  `,
};
