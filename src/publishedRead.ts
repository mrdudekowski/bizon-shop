import { mapArticle, type CmsArticle } from "./mapArticle";
import { mapHomePatch, mapShopHomePatch, mapStubPatch, type HomePatch, type ShopHomePatch, type StubPatch } from "./mapPage";
import {
  mapShopCategory,
  mapShopProduct,
  mapShopVariant,
  type CmsProduct,
  type CmsShopCategory,
} from "./mapShop";
import {
  mapTireModel,
  mapTireType,
  mapTireVariant,
  normalizeImageUrl,
  type CmsTireModel,
  type CmsTireType,
  type CmsTireVariant,
} from "./mapTire";
import {
  mapWheelGallery,
  mapWheelModel,
  mapWheelType,
  mapWheelVariant,
  type CmsWheelModel,
  type CmsWheelType,
  type CmsWheelVariant,
} from "./mapWheel";

export type ReadDatabase = {
  query(sql: string, params?: unknown[]): Promise<Record<string, unknown>[]>;
  withReadSnapshot?<T>(run: (snapshot: ReadDatabase) => Promise<T>): Promise<T>;
};

export const PUBLIC_STUB_PAGE_KEYS = [
  "about",
  "contact",
  "warranty",
  "branding",
  "become-a-supplier",
  "privacy-policy",
  "shop-delivery-returns",
] as const;

function readStringColumn(rows: Record<string, unknown>[], column: string): string[] {
  return rows.flatMap((row) => (typeof row[column] === "string" ? [row[column]] : []));
}

const GALLERY_TABLES = {
  tire_models_rels: true,
  wheel_models_rels: true,
  products_rels: true,
} as const;

async function readGalleryUrls(
  db: ReadDatabase,
  table: keyof typeof GALLERY_TABLES,
  parentId: unknown,
): Promise<string[]> {
  const rows = await db.query(
    `
      SELECT media.url AS image_url
      FROM ${table} AS rels
      JOIN media ON media.id = rels.media_id
      WHERE rels.parent_id = $1 AND rels.path = 'gallery'
      ORDER BY rels."order", rels.id
    `,
    [parentId],
  );
  return rows.flatMap((row) => {
    const imageUrl = normalizeImageUrl(typeof row.image_url === "string" ? row.image_url : null);
    return imageUrl ? [imageUrl] : [];
  });
}

export async function readTireTypes(db: ReadDatabase): Promise<CmsTireType[]> {
  const tireTypeRows = await db.query(`
    SELECT tire_types.*, media.url AS image_url
    FROM tire_types
    LEFT JOIN media ON media.id = tire_types.cover_image_id
    WHERE tire_types.status = 'published'
    ORDER BY tire_types.sort_order, tire_types.id
  `);

  return Promise.all(
    tireTypeRows.map(async (tireTypeRow) => {
      const [vehicleTypeRows, conditionRows] = await Promise.all([
        db.query(
          "SELECT value FROM tire_types_selection_vehicle_types WHERE parent_id = $1",
          [tireTypeRow.id],
        ),
        db.query(
          "SELECT value FROM tire_types_selection_conditions WHERE parent_id = $1",
          [tireTypeRow.id],
        ),
      ]);

      return mapTireType(tireTypeRow as Parameters<typeof mapTireType>[0], {
        vehicleTypes: readStringColumn(vehicleTypeRows, "value"),
        conditions: readStringColumn(conditionRows, "value"),
      });
    }),
  );
}

export async function readTireModelsByType(
  db: ReadDatabase,
  typeSlug: string,
): Promise<CmsTireModel[]> {
  const modelRows = await db.query(
    `
      SELECT tire_models.*, tire_types.slug AS tire_type_slug, tire_types.name AS tire_type_name,
        media.url AS image_url
      FROM tire_models
      JOIN tire_types ON tire_types.id = tire_models.tire_type_id
      LEFT JOIN media ON media.id = tire_models.main_image_id
      WHERE tire_models.status = 'published'
        AND tire_types.status = 'published'
        AND tire_types.slug = $1
      ORDER BY tire_models.name, tire_models.id
    `,
    [typeSlug],
  );

  return Promise.all(
    modelRows.map(async (modelRow) => {
      const [axleRows, featureRows, gallery, applicationRows] = await Promise.all([
        db.query("SELECT value FROM tire_models_positions WHERE parent_id = $1", [modelRow.id]),
        db.query(
          `
            SELECT key, title, description
            FROM tire_models_features
            WHERE _parent_id = $1
            ORDER BY _order
          `,
          [modelRow.id],
        ),
        readGalleryUrls(db, "tire_models_rels", modelRow.id),
        db.query("SELECT value FROM tire_models_application_types WHERE parent_id = $1", [modelRow.id]),
      ]);

      return mapTireModel({
        row: modelRow as Parameters<typeof mapTireModel>[0]["row"],
        tireType: {
          slug: modelRow.tire_type_slug as string,
          name: modelRow.tire_type_name as string,
        },
        imageUrl: typeof modelRow.image_url === "string" ? modelRow.image_url : null,
        gallery,
        advantages: featureRows.map(({ key, title, description }) => ({ key, title, description })),
        selectionAxles: readStringColumn(axleRows, "value"),
        applicationTypes: readStringColumn(applicationRows, "value"),
      });
    }),
  );
}

export async function readTireModel(
  db: ReadDatabase,
  typeSlug: string,
  modelSlug: string,
): Promise<CmsTireModel | null> {
  const [modelRow] = await db.query(
    `
      SELECT tire_models.*, tire_types.slug AS tire_type_slug, tire_types.name AS tire_type_name,
        media.url AS image_url
      FROM tire_models
      JOIN tire_types ON tire_types.id = tire_models.tire_type_id
      LEFT JOIN media ON media.id = tire_models.main_image_id
      WHERE tire_models.status = 'published'
        AND tire_types.status = 'published'
        AND tire_types.slug = $1
        AND tire_models.slug = $2
    `,
    [typeSlug, modelSlug],
  );

  if (!modelRow) {
    return null;
  }

  const [axleRows, featureRows, gallery, applicationRows] = await Promise.all([
    db.query("SELECT value FROM tire_models_positions WHERE parent_id = $1", [modelRow.id]),
    db.query(
      `
        SELECT key, title, description
        FROM tire_models_features
        WHERE _parent_id = $1
        ORDER BY _order
      `,
      [modelRow.id],
    ),
    readGalleryUrls(db, "tire_models_rels", modelRow.id),
    db.query("SELECT value FROM tire_models_application_types WHERE parent_id = $1", [modelRow.id]),
  ]);

  return mapTireModel({
    row: modelRow as Parameters<typeof mapTireModel>[0]["row"],
    tireType: {
      slug: modelRow.tire_type_slug as string,
      name: modelRow.tire_type_name as string,
    },
    imageUrl: typeof modelRow.image_url === "string" ? modelRow.image_url : null,
    gallery,
    advantages: featureRows.map(({ key, title, description }) => ({ key, title, description })),
    selectionAxles: readStringColumn(axleRows, "value"),
    applicationTypes: readStringColumn(applicationRows, "value"),
  });
}

export async function readTireVariants(
  db: ReadDatabase,
  modelId: string | number,
): Promise<CmsTireVariant[]> {
  const variantRows = await db.query(
    `
      SELECT *
      FROM tire_variants
      WHERE tire_model_id = $1 AND status = 'published'
      ORDER BY sort_order, id
    `,
    [modelId],
  );

  return variantRows.map((variantRow) =>
    mapTireVariant(variantRow as Parameters<typeof mapTireVariant>[0]),
  );
}

export async function readHomePatch(db: ReadDatabase): Promise<HomePatch | null> {
  const [homeRow] = await db.query(`
    SELECT pages.seo_seo_title, pages.seo_seo_description, pages.home_hero_eyebrow, pages.home_hero_title,
      pages.home_hero_lead, pages.home_hero_primary_cta_label, pages.home_hero_primary_cta_href,
      pages.home_hero_secondary_cta_label, pages.home_hero_secondary_cta_href, pages.home_hero_metric_label,
      pages.home_hero_metric_text, hero_media.url AS home_hero_image_url,
      pages.home_selection_entry_eyebrow, pages.home_selection_entry_title, pages.home_selection_entry_lead,
      pages.home_selection_entry_image_alt,
      selection_media.url AS home_selection_entry_image_url,
      pages.home_shop_campaign_eyebrow, pages.home_shop_campaign_title, pages.home_shop_campaign_lead,
      pages.home_shop_campaign_image_alt, pages.home_shop_campaign_cta_label, pages.home_shop_campaign_cta_href,
      campaign_media.url AS home_shop_campaign_image_url,
      pages.home_directions_eyebrow, pages.home_directions_title, pages.home_directions_lead,
      pages.home_expertise_eyebrow, pages.home_expertise_title, pages.home_expertise_lead
    FROM pages
    LEFT JOIN media AS hero_media ON hero_media.id = pages.home_hero_image_id
    LEFT JOIN media AS selection_media ON selection_media.id = pages.home_selection_entry_image_id
    LEFT JOIN media AS campaign_media ON campaign_media.id = pages.home_shop_campaign_image_id
    WHERE pages.key = 'home' AND pages.status = 'published'
  `);

  return homeRow ? mapHomePatch(homeRow as Parameters<typeof mapHomePatch>[0]) : null;
}

export async function readShopHomePatch(db: ReadDatabase): Promise<ShopHomePatch | null> {
  const [row] = await db.query(`
    SELECT pages.id, pages.seo_seo_title, pages.seo_seo_description, pages.shop_hero_eyebrow, pages.shop_hero_title,
      pages.shop_hero_lead, pages.shop_hero_cta_label, pages.shop_hero_cta_href, pages.shop_hero_image_alt,
      media.url AS shop_hero_image_url,
      pages.shop_wheels_intro_kicker, pages.shop_wheels_intro_eyebrow, pages.shop_wheels_intro_title, pages.shop_wheels_intro_lead,
      pages.shop_vehicles_eyebrow, pages.shop_vehicles_title, pages.shop_vehicles_lead,
      pages.shop_vehicles_cta_label, pages.shop_vehicles_cta_href,
      pages.shop_catalog_eyebrow, pages.shop_catalog_title, pages.shop_catalog_lead, pages.shop_catalog_section_title
    FROM pages
    LEFT JOIN media ON media.id = pages.shop_hero_image_id
    WHERE pages.key = 'shop-home' AND pages.status = 'published'
  `);
  if (!row) return null;
  const parentId = row.id;
  const [carousel, catalogTiles, vehicles, orderSteps] = await Promise.all([
    db.query(
      `
        SELECT slides.id, slides.kicker, slides.title, slides.action, slides.href, slides.alt,
          desktop.url AS desktop_image_url, mobile.url AS mobile_image_url
        FROM pages_shop_category_carousel slides
        LEFT JOIN media AS desktop ON desktop.id = slides.desktop_image_id
        LEFT JOIN media AS mobile ON mobile.id = slides.mobile_image_id
        WHERE slides._parent_id = $1
        ORDER BY slides._order
      `,
      [parentId],
    ),
    db.query(
      `SELECT tiles.category_id, categories.slug AS category_slug, tiles.title, tiles.visible,
        tiles._order AS sort_order, icon.url AS icon_url, image.url AS image_url,
        carousel.url AS carousel_image_url, tiles.icon_alt, tiles.image_alt,
        tiles.carousel_image_alt, (tiles.carousel_image_media_id IS NOT NULL) AS carousel_visible
       FROM pages_shop_catalog_tiles tiles
       JOIN shop_categories categories ON categories.id = tiles.category_id AND categories.status = 'published'
       LEFT JOIN media AS icon ON icon.id = tiles.icon_media_id
       LEFT JOIN media AS image ON image.id = tiles.image_media_id
       LEFT JOIN media AS carousel ON carousel.id = tiles.carousel_image_media_id
       WHERE tiles._parent_id = $1
       ORDER BY tiles._order, tiles.id`,
      [parentId],
    ),
    db.query(
      `
        SELECT slides.title, slides.alt, media.url AS image_url
        FROM pages_shop_vehicles_slides slides
        LEFT JOIN media ON media.id = slides.image_id
        WHERE slides._parent_id = $1
        ORDER BY slides._order
      `,
      [parentId],
    ),
    db.query(
      `
        SELECT title, description
        FROM pages_shop_order_steps
        WHERE _parent_id = $1
        ORDER BY _order
      `,
      [parentId],
    ),
  ]);
  return mapShopHomePatch({
    row: row as Parameters<typeof mapShopHomePatch>[0]["row"],
    carousel: carousel as Parameters<typeof mapShopHomePatch>[0]["carousel"],
    vehicles: vehicles as Parameters<typeof mapShopHomePatch>[0]["vehicles"],
    orderSteps,
    catalogTiles: catalogTiles as Parameters<typeof mapShopHomePatch>[0]["catalogTiles"],
  });
}

export async function readArticles(db: ReadDatabase): Promise<CmsArticle[]> {
  const articleRows = await db.query(`
    SELECT tire_iq_articles.*, media.url AS image_url,
      ARRAY(SELECT taxonomy.value FROM tire_iq_articles_taxonomy taxonomy
        WHERE taxonomy._parent_id = tire_iq_articles.id ORDER BY taxonomy._order) AS taxonomy
    FROM tire_iq_articles
    LEFT JOIN media ON media.id = tire_iq_articles.featured_image_id
    WHERE tire_iq_articles.status = 'published'
  `);

  return articleRows.map((articleRow) => mapArticle(articleRow as Parameters<typeof mapArticle>[0]));
}

export async function readArticleBySlug(
  db: ReadDatabase,
  slug: string,
): Promise<CmsArticle | null> {
  const [articleRow] = await db.query(
    `
      SELECT tire_iq_articles.*, media.url AS image_url,
        ARRAY(SELECT taxonomy.value FROM tire_iq_articles_taxonomy taxonomy
          WHERE taxonomy._parent_id = tire_iq_articles.id ORDER BY taxonomy._order) AS taxonomy
      FROM tire_iq_articles
      LEFT JOIN media ON media.id = tire_iq_articles.featured_image_id
      WHERE tire_iq_articles.status = 'published' AND tire_iq_articles.slug = $1
    `,
    [slug],
  );

  return articleRow ? mapArticle(articleRow as Parameters<typeof mapArticle>[0]) : null;
}

const STUB_PAGE_KEYS = new Set<string>(PUBLIC_STUB_PAGE_KEYS);

export async function readStubPatch(db: ReadDatabase, key: string): Promise<StubPatch | null> {
  if (!STUB_PAGE_KEYS.has(key)) return null;
  const [row] = await db.query(
    `
      SELECT pages.seo_seo_title, pages.seo_seo_description, pages.stub_hero_eyebrow, pages.stub_hero_title,
        pages.stub_hero_lead, pages.stub_hero_image_alt, media.url AS stub_hero_image_url
      FROM pages
      LEFT JOIN media ON media.id = pages.stub_hero_image_id
      WHERE pages.key = $1 AND pages.status = 'published'
    `,
    [key],
  );
  return row ? mapStubPatch(row as Parameters<typeof mapStubPatch>[0]) : null;
}

async function readWheelGallery(db: ReadDatabase, parentId: unknown) {
  const rows = await db.query(
    `
      SELECT media.url AS image_url, media.alt AS image_alt
      FROM wheel_models_rels AS rels
      JOIN media ON media.id = rels.media_id
      WHERE rels.parent_id = $1 AND rels.path = 'gallery'
      ORDER BY rels."order", rels.id
    `,
    [parentId],
  );
  return mapWheelGallery(rows);
}

export async function readWheelTypes(db: ReadDatabase): Promise<CmsWheelType[]> {
  const rows = await db.query(`
    SELECT wheel_types.*, media.url AS image_url
    FROM wheel_types
    LEFT JOIN media ON media.id = wheel_types.cover_image_id
    WHERE wheel_types.status = 'published'
    ORDER BY wheel_types.sort_order, wheel_types.name
  `);
  return rows.map((row) => mapWheelType(row as Parameters<typeof mapWheelType>[0]));
}

async function readWheelModelRows(db: ReadDatabase, typeSlug: string, modelSlug?: string) {
  const params: unknown[] = [typeSlug];
  const modelFilter = modelSlug ? " AND wheel_models.slug = $2" : "";
  if (modelSlug) params.push(modelSlug);
  return db.query(
    `
      SELECT wheel_models.*, wheel_types.slug AS wheel_type_slug, wheel_types.name AS wheel_type_name,
        media.url AS image_url
      FROM wheel_models
      JOIN wheel_types ON wheel_types.id = wheel_models.wheel_type_id
      LEFT JOIN media ON media.id = wheel_models.main_image_id
      WHERE wheel_models.status = 'published'
        AND wheel_types.status = 'published'
        AND wheel_types.slug = $1
        ${modelFilter}
      ORDER BY wheel_models.menu_order, wheel_models.name
    `,
    params,
  );
}

async function mapPublishedWheelModel(db: ReadDatabase, row: Record<string, unknown>) {
  const gallery = await readWheelGallery(db, row.id);
  return mapWheelModel(
    row as Parameters<typeof mapWheelModel>[0],
    typeof row.image_url === "string" ? row.image_url : null,
    gallery,
  );
}

export async function readWheelModelsByType(
  db: ReadDatabase,
  typeSlug: string,
): Promise<CmsWheelModel[]> {
  const rows = await readWheelModelRows(db, typeSlug);
  return Promise.all(rows.map((row) => mapPublishedWheelModel(db, row)));
}

export async function readWheelModel(
  db: ReadDatabase,
  typeSlug: string,
  modelSlug: string,
): Promise<CmsWheelModel | null> {
  const [row] = await readWheelModelRows(db, typeSlug, modelSlug);
  return row ? mapPublishedWheelModel(db, row) : null;
}

export async function readWheelVariants(
  db: ReadDatabase,
  modelId: string | number,
): Promise<CmsWheelVariant[]> {
  const rows = await db.query(
    `
      SELECT *
      FROM wheel_variants
      WHERE wheel_model_id = $1 AND status = 'published'
      ORDER BY sort_order, id
    `,
    [modelId],
  );
  return rows.map((row) => mapWheelVariant(row as Parameters<typeof mapWheelVariant>[0]));
}

export async function readWheelVariantsByType(
  db: ReadDatabase,
  typeSlug: string,
): Promise<CmsWheelVariant[]> {
  const rows = await db.query(
    `
      SELECT wheel_variants.*
      FROM wheel_variants
      JOIN wheel_models ON wheel_models.id = wheel_variants.wheel_model_id
      JOIN wheel_types ON wheel_types.id = wheel_models.wheel_type_id
      WHERE wheel_types.slug = $1
        AND wheel_types.status = 'published'
        AND wheel_models.status = 'published'
        AND wheel_variants.status = 'published'
      ORDER BY wheel_variants.sort_order, wheel_variants.id
    `,
    [typeSlug],
  );
  return rows.map((row) => mapWheelVariant(row as Parameters<typeof mapWheelVariant>[0]));
}

export async function readShopCategories(db: ReadDatabase): Promise<CmsShopCategory[]> {
  const rows = await db.query(`
    SELECT shop_categories.*, media.url AS image_url
    FROM shop_categories
    LEFT JOIN media ON media.id = shop_categories.cover_image_id
    WHERE shop_categories.status = 'published'
    ORDER BY shop_categories.sort_order, shop_categories.name
  `);
  const slides = await db.query(`
    SELECT slides.shop_category_id, slides.title, media.url AS image_url
    FROM shop_category_carousel slides
    LEFT JOIN media ON media.id = slides.image_id
    ORDER BY slides.sort_order, slides.id
  `);
  const slidesByCategory = new Map<string, { title?: string | null; image_url?: string | null }[]>();
  for (const slide of slides) {
    const categoryId = String(slide.shop_category_id);
    const frames = slidesByCategory.get(categoryId) ?? [];
    if (frames.length < 1) frames.push(slide);
    slidesByCategory.set(categoryId, frames);
  }
  return rows.map((row) =>
    mapShopCategory(row as Parameters<typeof mapShopCategory>[0], slidesByCategory.get(String(row.id)) ?? []),
  );
}

async function readShopProductRows(db: ReadDatabase, slug?: string, categorySlug?: string) {
  const params: unknown[] = [];
  const filters = [
    "products.status = 'published'",
    "shop_categories.status = 'published'",
  ];
  if (slug) {
    params.push(slug);
    filters.push(`products.slug = $${params.length}`);
  }
  if (categorySlug) {
    params.push(categorySlug);
    filters.push(`shop_categories.slug = $${params.length}`);
  }
  return db.query(
    `
      SELECT products.*, shop_categories.slug AS category_slug,
        shop_subcategories.slug AS subcategory_slug, shop_subcategories.name AS subcategory_name,
        media.url AS image_url
      FROM products
      JOIN shop_categories ON shop_categories.id = products.shop_category_id
      LEFT JOIN shop_subcategories ON shop_subcategories.id = products.subcategory_id
      LEFT JOIN media ON media.id = products.main_image_id
      WHERE ${filters.join(" AND ")}
      ORDER BY products.name, products.id
    `,
    params,
  );
}

async function mapPublishedShopProduct(db: ReadDatabase, row: Record<string, unknown>) {
  const [variantRows, gallery] = await Promise.all([
    db.query(
      "SELECT * FROM products_variants WHERE _parent_id = $1 ORDER BY _order, id",
      [row.id],
    ),
    readGalleryUrls(db, "products_rels", row.id),
  ]);
  return mapShopProduct(
    row as Parameters<typeof mapShopProduct>[0],
    typeof row.image_url === "string" ? row.image_url : null,
    gallery,
    variantRows.map((variant) => mapShopVariant(variant as Parameters<typeof mapShopVariant>[0])),
  );
}

export async function readShopProducts(
  db: ReadDatabase,
  categorySlug?: string,
): Promise<CmsProduct[]> {
  const rows = await readShopProductRows(db, undefined, categorySlug);
  return Promise.all(rows.map((row) => mapPublishedShopProduct(db, row)));
}

export async function readShopProductBySlug(
  db: ReadDatabase,
  slug: string,
): Promise<CmsProduct | null> {
  const [row] = await readShopProductRows(db, slug);
  return row ? mapPublishedShopProduct(db, row) : null;
}
