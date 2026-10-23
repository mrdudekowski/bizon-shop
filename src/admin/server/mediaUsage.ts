import type { MediaUsageRecord, MediaUsageState } from "../domain/types";
import { PUBLIC_STUB_PAGE_KEYS } from "../../publishedRead";

export const publicDocumentPageKeys = [...PUBLIC_STUB_PAGE_KEYS];

export type MediaUsageRow = {
  media_id: unknown;
  usage_id: unknown;
  top_level_key: unknown;
  top_level_label: unknown;
  page_key: unknown;
  page_label: unknown;
  placement_key: unknown;
  placement_label: unknown;
  state: unknown;
  review_recommended: unknown;
  diagnostic_reason: unknown;
  detachable: unknown;
  source_key?: unknown;
};

function stringValue(value: unknown): string {
  return value == null ? "" : String(value);
}

export function toMediaUsageRecord(row: MediaUsageRow): MediaUsageRecord {
  const sourceState = stringValue(row.state);
  const diagnosticReason = stringValue(row.diagnostic_reason);
  return {
    id: stringValue(row.usage_id),
    mediaId: stringValue(row.media_id),
    topLevelKey: stringValue(row.top_level_key),
    topLevelLabel: stringValue(row.top_level_label),
    pageKey: stringValue(row.page_key),
    pageLabel: stringValue(row.page_label),
    placementKey: stringValue(row.placement_key),
    placementLabel: stringValue(row.placement_label),
    state: (sourceState === "published" ? "published-visible" : sourceState === "draft" ? "draft-unpublished" : "hidden-not-rendered") as MediaUsageState,
    reviewRecommended: row.review_recommended === true,
    ...(diagnosticReason ? { diagnosticReason } : {}),
    detachable: row.detachable === true,
    ...(stringValue(row.source_key) ? { sourceKey: stringValue(row.source_key) } : {}),
  };
}

/**
 * Usage rows mirror the published-read joins and status predicates. A linked row is
 * never called published merely because a media FK exists; its owning entity and
 * any parent required by the public reader must also be published.
 */
export const mediaUsageSql = `
  WITH usages AS (
    SELECT cover_image_id AS media_id, 'tire_types|' || cover_image_id::text || '|' || id::text AS usage_id,
      'catalog' AS top_level_key, 'Каталог' AS top_level_label, 'tires' AS page_key, 'Шины' AS page_label,
      'tire-type.cover' AS placement_key, 'Тип шин → обложка' AS placement_label,
      CASE WHEN status = 'published' THEN 'published' ELSE 'hidden' END AS state,
      false AS review_recommended, NULL::text AS diagnostic_reason, true AS detachable,
      'tire_types|cover_image_id|' || id::text AS source_key
    FROM tire_types WHERE cover_image_id = ANY($1::int[])
    UNION ALL
    SELECT main_image_id, 'tire_models|main_image_id|' || tire_models.id::text, 'catalog', 'Каталог', 'tires', 'Шины', 'tire-model.main', 'Модель шины → основное фото',
      CASE WHEN tire_models.status = 'published' AND tire_types.status = 'published' THEN 'published' ELSE 'hidden' END,
      false, NULL::text, true, 'tire_models|main_image_id|' || tire_models.id::text
    FROM tire_models JOIN tire_types ON tire_types.id = tire_models.tire_type_id WHERE main_image_id = ANY($1::int[])
    UNION ALL
    SELECT cover_image_id, 'wheel_types|cover_image_id|' || id::text, 'catalog', 'Каталог', 'wheels', 'Диски', 'wheel-type.cover', 'Тип дисков → обложка',
      CASE WHEN status = 'published' THEN 'published' ELSE 'hidden' END, false, NULL::text, true, 'wheel_types|cover_image_id|' || id::text
    FROM wheel_types WHERE cover_image_id = ANY($1::int[])
    UNION ALL
    SELECT wheel_models.main_image_id, 'wheel_models|main_image_id|' || wheel_models.id::text, 'catalog', 'Каталог', 'wheels', 'Диски', 'wheel-model.main', 'Модель дисков → основное фото',
      CASE WHEN wheel_models.status = 'published' AND wheel_types.status = 'published' THEN 'published' ELSE 'hidden' END,
      false, NULL::text, true, 'wheel_models|main_image_id|' || wheel_models.id::text
    FROM wheel_models JOIN wheel_types ON wheel_types.id = wheel_models.wheel_type_id WHERE wheel_models.main_image_id = ANY($1::int[])
    UNION ALL
    SELECT cover_image_id, 'shop_categories|cover_image_id|' || id::text, 'shop', 'Bizon Shop', 'shop-categories', 'Категории', 'category.cover', 'Категория → обложка',
      CASE WHEN status = 'published' THEN 'published' ELSE 'hidden' END, false, NULL::text, true, 'shop_categories|cover_image_id|' || id::text
    FROM shop_categories WHERE cover_image_id = ANY($1::int[])
    UNION ALL
    SELECT products.main_image_id, 'products|main_image_id|' || products.id::text, 'shop', 'Bizon Shop', 'shop-catalog', 'Каталог', 'product.main', 'Товар → основное фото',
      CASE WHEN products.status = 'published' AND shop_categories.status = 'published' THEN 'published' ELSE 'hidden' END,
      false, NULL::text, true, 'products|main_image_id|' || products.id::text
    FROM products JOIN shop_categories ON shop_categories.id = products.shop_category_id WHERE products.main_image_id = ANY($1::int[])
    UNION ALL
    SELECT tire_iq_articles.featured_image_id, 'tire_iq_articles|featured_image_id|' || tire_iq_articles.id::text, 'tire-iq', 'Tire IQ', 'articles', 'Статьи', 'article.featured', 'Статья → обложка',
      CASE WHEN tire_iq_articles.status = 'published' THEN 'published' ELSE 'hidden' END, false, NULL::text, true,
      'tire_iq_articles|featured_image_id|' || tire_iq_articles.id::text
    FROM tire_iq_articles WHERE featured_image_id = ANY($1::int[])
    UNION ALL
    SELECT (to_jsonb(pages)->>slot.column_name)::int, 'pages|' || slot.column_name || '|' || pages.id::text, 'site', 'Сайт', pages.key::text,
      CASE pages.key WHEN 'home' THEN 'Главная' WHEN 'shop-home' THEN 'Главная Bizon Shop' ELSE pages.key::text END,
      slot.placement_key, slot.placement_label,
      CASE WHEN pages.status = 'published' AND slot.renderer_enabled THEN 'published' ELSE 'hidden' END,
      CASE WHEN slot.renderer_enabled THEN false ELSE true END,
      CASE WHEN slot.renderer_enabled THEN NULL::text ELSE 'Публичный read model не запрашивает этот слот для данной страницы.' END,
      true, 'pages|' || slot.column_name || '|' || pages.id::text
    FROM pages CROSS JOIN LATERAL (VALUES
      ('home_hero_image_id', 'hero.image', 'Hero → изображение', pages.key = 'home'),
      ('home_selection_entry_image_id', 'selection.image', 'Устаревший блок подбора → изображение', false),
      ('home_shop_campaign_image_id', 'shop-campaign.image', 'Кампания Shop → изображение', pages.key = 'home'),
      ('home_expertise_image_id', 'expertise.image', 'Экспертиза → изображение', pages.key = 'home'),
      ('home_branding_before_image_id', 'branding.before', 'Брендинг → до', pages.key = 'home'),
      ('home_branding_after_image_id', 'branding.after', 'Брендинг → после', pages.key = 'home'),
      ('shop_hero_image_id', 'hero.image', 'Hero → изображение', pages.key = 'shop-home'),
      ('stub_hero_image_id', 'hero.image', 'Hero → изображение', pages.stub_hero_configured AND pages.key::text = ANY($2::text[])),
      ('editorial_proof_image_id', 'editorial.proof', 'Редакционный блок → изображение', pages.editorial_configured AND pages.editorial_proof_configured AND pages.key::text = ANY($2::text[]))
    ) AS slot(column_name, placement_key, placement_label, renderer_enabled)
    WHERE (to_jsonb(pages)->>slot.column_name)::int = ANY($1::int[])
    UNION ALL
    SELECT tiles.carousel_image_media_id, 'pages_shop_catalog_tiles|carousel_image_media_id|' || tiles.id::text,
      'shop', 'Bizon Shop', 'shop-home', 'Главная Bizon Shop', 'catalog.carousel', 'Карусель → изображение категории',
      CASE WHEN pages.status = 'published' AND categories.status = 'published' AND tiles.carousel_visible THEN 'published' ELSE 'hidden' END,
      false, NULL::text, true, 'pages_shop_catalog_tiles|carousel_image_media_id|' || tiles.id::text
    FROM pages_shop_catalog_tiles AS tiles JOIN pages ON pages.id = tiles._parent_id JOIN shop_categories AS categories ON categories.id = tiles.category_id
    WHERE tiles.carousel_image_media_id = ANY($1::int[])
    UNION ALL
    SELECT tiles.image_media_id, 'pages_shop_catalog_tiles|image_media_id|' || tiles.id::text,
      'shop', 'Bizon Shop', 'shop-home', 'Главная Bizon Shop', 'catalog.tile.image', 'Каталог → изображение плитки',
      CASE WHEN pages.status = 'published' AND categories.status = 'published' AND tiles.visible THEN 'published' ELSE 'hidden' END,
      false, NULL::text, true, 'pages_shop_catalog_tiles|image_media_id|' || tiles.id::text
    FROM pages_shop_catalog_tiles AS tiles JOIN pages ON pages.id = tiles._parent_id JOIN shop_categories AS categories ON categories.id = tiles.category_id
    WHERE tiles.image_media_id = ANY($1::int[])
    UNION ALL
    SELECT tiles.icon_media_id, 'pages_shop_catalog_tiles|icon_media_id|' || tiles.id::text,
      'shop', 'Bizon Shop', 'shop-home', 'Главная Bizon Shop', 'catalog.tile.icon', 'Каталог → значок плитки',
      CASE WHEN pages.status = 'published' AND categories.status = 'published' AND tiles.visible THEN 'published' ELSE 'hidden' END,
      false, NULL::text, true, 'pages_shop_catalog_tiles|icon_media_id|' || tiles.id::text
    FROM pages_shop_catalog_tiles AS tiles JOIN pages ON pages.id = tiles._parent_id JOIN shop_categories AS categories ON categories.id = tiles.category_id
    WHERE tiles.icon_media_id = ANY($1::int[])
    UNION ALL
    SELECT slides.desktop_image_id, 'pages_shop_category_carousel|desktop_image_id|' || slides.id::text,
      'shop', 'Bizon Shop', 'shop-home', 'Главная Bizon Shop', 'shop.carousel.desktop', 'Карусель → изображение для desktop',
      CASE WHEN pages.status = 'published' THEN 'published' ELSE 'hidden' END, false, NULL::text, true,
      'pages_shop_category_carousel|desktop_image_id|' || slides.id::text
    FROM pages_shop_category_carousel AS slides JOIN pages ON pages.id = slides._parent_id
    WHERE slides.desktop_image_id = ANY($1::int[])
    UNION ALL
    SELECT slides.mobile_image_id, 'pages_shop_category_carousel|mobile_image_id|' || slides.id::text,
      'shop', 'Bizon Shop', 'shop-home', 'Главная Bizon Shop', 'shop.carousel.mobile', 'Карусель → изображение для mobile',
      CASE WHEN pages.status = 'published' THEN 'published' ELSE 'hidden' END, false, NULL::text, true,
      'pages_shop_category_carousel|mobile_image_id|' || slides.id::text
    FROM pages_shop_category_carousel AS slides JOIN pages ON pages.id = slides._parent_id
    WHERE slides.mobile_image_id = ANY($1::int[])
    UNION ALL
    SELECT slides.image_id, 'pages_shop_vehicles_slides|image_id|' || slides.id::text,
      'shop', 'Bizon Shop', 'shop-home', 'Главная Bizon Shop', 'shop.vehicles.slide', 'Транспорт → слайд',
      CASE WHEN pages.status = 'published' THEN 'published' ELSE 'hidden' END, false, NULL::text, true,
      'pages_shop_vehicles_slides|image_id|' || slides.id::text
    FROM pages_shop_vehicles_slides AS slides JOIN pages ON pages.id = slides._parent_id
    WHERE slides.image_id = ANY($1::int[])
    UNION ALL
    SELECT slides.image_id, 'shop_category_carousel|image_id|' || slides.id::text,
      'shop', 'Bizon Shop', categories.slug, categories.name, 'category.carousel', 'Категория → карусель',
      CASE WHEN categories.status = 'published' AND NOT EXISTS (
        SELECT 1 FROM shop_category_carousel AS earlier
        WHERE earlier.shop_category_id = slides.shop_category_id
          AND (earlier.sort_order, earlier.id) < (slides.sort_order, slides.id)
      ) THEN 'published' ELSE 'hidden' END,
      CASE WHEN EXISTS (
        SELECT 1 FROM shop_category_carousel AS earlier
        WHERE earlier.shop_category_id = slides.shop_category_id
          AND (earlier.sort_order, earlier.id) < (slides.sort_order, slides.id)
      ) THEN true ELSE false END,
      CASE WHEN EXISTS (
        SELECT 1 FROM shop_category_carousel AS earlier
        WHERE earlier.shop_category_id = slides.shop_category_id
          AND (earlier.sort_order, earlier.id) < (slides.sort_order, slides.id)
      ) THEN 'Публичная модель категории выводит только первый слайд карусели.' ELSE NULL::text END, true,
      'shop_category_carousel|image_id|' || slides.id::text
    FROM shop_category_carousel AS slides JOIN shop_categories AS categories ON categories.id = slides.shop_category_id
    WHERE slides.image_id = ANY($1::int[])
    UNION ALL
    SELECT links.media_id, 'cms_document_links|' || links.id::text, 'site', 'Сайт',
      CASE WHEN links.entity_type = 'page' THEN links.entity_id ELSE links.entity_type || ':' || links.entity_id END,
      COALESCE(pages.key::text, tire_models.name, wheel_models.name, links.entity_type || ':' || links.entity_id),
      'documents.' || links.entity_type, 'Документы → ' || links.title,
      CASE WHEN (pages.status = 'published' AND pages.key::text = ANY($2::text[])) OR (tire_models.status = 'published' AND tire_types.status = 'published') OR (wheel_models.status = 'published' AND wheel_types.status = 'published') THEN 'published' ELSE 'hidden' END,
      CASE WHEN (links.entity_type = 'page' AND (pages.id IS NULL OR pages.key::text <> ALL($2::text[])))
        OR (links.entity_type = 'tire-model' AND tire_models.id IS NULL)
        OR (links.entity_type = 'wheel-model' AND wheel_models.id IS NULL) THEN true ELSE false END,
      CASE WHEN links.entity_type = 'page' AND pages.id IS NULL THEN 'Страница-владелец связи отсутствует.'
        WHEN links.entity_type = 'page' AND pages.key::text <> ALL($2::text[]) THEN 'Публичный read model не выводит документы для этой страницы.'
        WHEN links.entity_type = 'tire-model' AND tire_models.id IS NULL THEN 'Модель-владелец связи отсутствует.'
        WHEN links.entity_type = 'wheel-model' AND wheel_models.id IS NULL THEN 'Модель-владелец связи отсутствует.'
        ELSE NULL::text END, true, 'cms_document_links|media_id|' || links.id::text
    FROM cms_document_links AS links
      LEFT JOIN pages ON links.entity_type = 'page' AND links.entity_id = pages.key::text
      LEFT JOIN tire_models ON links.entity_type = 'tire-model' AND links.entity_id = tire_models.id::text
      LEFT JOIN tire_types ON tire_types.id = tire_models.tire_type_id
      LEFT JOIN wheel_models ON links.entity_type = 'wheel-model' AND links.entity_id = wheel_models.id::text
      LEFT JOIN wheel_types ON wheel_types.id = wheel_models.wheel_type_id
    WHERE links.media_id = ANY($1::int[])
    UNION ALL
    SELECT rels.media_id, 'tire_models_rels|' || rels.id::text, 'catalog', 'Каталог', 'tires', 'Шины', 'tire-model.gallery', 'Модель шины → галерея',
      CASE WHEN tire_models.status = 'published' AND tire_types.status = 'published' THEN 'published' ELSE 'hidden' END,
      false, NULL::text, true, 'tire_models_rels|media_id|' || rels.id::text
    FROM tire_models_rels AS rels JOIN tire_models ON tire_models.id = rels.parent_id JOIN tire_types ON tire_types.id = tire_models.tire_type_id WHERE rels.media_id = ANY($1::int[]) AND rels.path = 'gallery'
    UNION ALL
    SELECT rels.media_id, 'wheel_models_rels|' || rels.id::text, 'catalog', 'Каталог', 'wheels', 'Диски', 'wheel-model.gallery', 'Модель дисков → галерея',
      CASE WHEN wheel_models.status = 'published' AND wheel_types.status = 'published' THEN 'published' ELSE 'hidden' END,
      false, NULL::text, true, 'wheel_models_rels|media_id|' || rels.id::text
    FROM wheel_models_rels AS rels JOIN wheel_models ON wheel_models.id = rels.parent_id JOIN wheel_types ON wheel_types.id = wheel_models.wheel_type_id WHERE rels.media_id = ANY($1::int[]) AND rels.path = 'gallery'
    UNION ALL
    SELECT rels.media_id, 'products_rels|' || rels.id::text, 'shop', 'Bizon Shop', 'shop-catalog', 'Каталог', 'product.gallery', 'Товар → галерея',
      CASE WHEN products.status = 'published' AND shop_categories.status = 'published' THEN 'published' ELSE 'hidden' END,
      false, NULL::text, true, 'products_rels|media_id|' || rels.id::text
    FROM products_rels AS rels JOIN products ON products.id = rels.parent_id JOIN shop_categories ON shop_categories.id = products.shop_category_id WHERE rels.media_id = ANY($1::int[]) AND rels.path = 'gallery'
    UNION ALL
    SELECT rels.media_id, 'products_variants_rels|' || rels.id::text, 'shop', 'Bizon Shop', 'shop-catalog', 'Каталог', 'product.variant', 'Вариант товара → изображение',
      CASE WHEN products.status = 'published' AND shop_categories.status = 'published' THEN 'published' ELSE 'hidden' END,
      false, NULL::text, true, 'products_variants_rels|media_id|' || rels.id::text
    FROM products_variants_rels AS rels JOIN products_variants AS variants ON variants.id = rels.parent_id
      JOIN products ON products.id = variants._parent_id JOIN shop_categories ON shop_categories.id = products.shop_category_id
    WHERE rels.media_id = ANY($1::int[]) AND rels.path = 'image'
  )
  SELECT * FROM usages
`;
