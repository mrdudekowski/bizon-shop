import type { Migration } from "../migrationRunner";

export const homeShopCarouselCopyMigration: Migration = {
  version: "202611120038",
  description: "Store homepage Shop carousel captions with the Shop showcase",
  sql: `
    ALTER TABLE pages
      ADD COLUMN IF NOT EXISTS shop_home_disk_carousel_caption text NOT NULL DEFAULT 'Кованые диски, созданные под ваш автомобиль';

    ALTER TABLE pages_shop_catalog_tiles
      ADD COLUMN IF NOT EXISTS home_carousel_caption text NOT NULL DEFAULT '';

    UPDATE pages_shop_catalog_tiles AS tiles
    SET home_carousel_caption = CASE
      WHEN lower(categories.name) LIKE '%комфорт%'
        THEN 'Обвесы и аксессуары для вашего авто'
      WHEN lower(categories.name) LIKE '%кемпинг%' OR categories.slug = 'outdoor'
        THEN 'Всё для поездок, отдыха и маршрутов за городом'
      WHEN lower(categories.name) LIKE '%прицеп%' OR categories.slug = 'pritsepy'
        THEN 'Прицеп — сердце вашего off-road-путешествия'
      WHEN lower(categories.name) LIKE '%масла%' OR lower(categories.name) LIKE '%запчаст%'
        OR categories.slug LIKE '%masla%' OR categories.slug LIKE '%zapchast%'
        THEN 'Масла и детали для регулярного обслуживания'
      WHEN lower(categories.name) = 'аксессуары'
        THEN 'Аксессуары для вашего стиля'
      ELSE tiles.home_carousel_caption
    END
    FROM shop_categories AS categories
    WHERE categories.id = tiles.category_id
      AND tiles.home_carousel_caption = '';
  `,
};
