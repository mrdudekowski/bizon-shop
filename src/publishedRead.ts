import { isPageFormKey, loadPageForm } from "./content/pageForm";
import { readSiteProfile } from "./content/siteProfile";
import { mapArticle, type CmsArticle } from "./mapArticle";
import { mapHomePatch, mapShopHomePatch, mapStubPatch, publishedShopCampaignFrames, type HomePatch, type ShopHomePatch, type StubPatch } from "./mapPage";
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
import { mapPublishedDocuments } from "./documentLinks";

export type ReadDatabase = {
  query(sql: string, params?: unknown[]): Promise<Record<string, unknown>[]>;
  withReadSnapshot?<T>(run: (snapshot: ReadDatabase) => Promise<T>): Promise<T>;
};

type PublicFocalByViewport = Partial<Record<"desktop" | "tablet" | "mobile", { x: number; y: number }>>;
type StoredFocal = { placementPath: string; mediaId: string | null; x: number; y: number; byViewport?: PublicFocalByViewport };

function parseFocalByViewport(value: unknown): PublicFocalByViewport | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;
  const result: PublicFocalByViewport = {};
  for (const viewport of ["desktop", "tablet", "mobile"] as const) {
    const point = (value as Record<string, unknown>)[viewport];
    if (!point || typeof point !== "object" || Array.isArray(point)) continue;
    const { x, y } = point as { x?: unknown; y?: unknown };
    if (typeof x !== "number" || !Number.isFinite(x) || typeof y !== "number" || !Number.isFinite(y)) continue;
    result[viewport] = { x: Math.min(1, Math.max(0, x)), y: Math.min(1, Math.max(0, y)) };
  }
  return Object.keys(result).length ? result : undefined;
}

async function readImageFocals(db: ReadDatabase, collection: string, id: unknown): Promise<Map<string, StoredFocal>> {
  const rows = await db.query(
    `SELECT placement_path, media_id::text AS media_id, focal_x, focal_y, focal_by_viewport FROM cms_image_focal_positions
     WHERE collection = $1 AND doc_id = $2`,
    [collection, String(id)],
  );
  return new Map(rows.flatMap((row) => typeof row.placement_path === "string"
    ? [[row.placement_path, {
        placementPath: row.placement_path,
        mediaId: row.media_id === null || row.media_id === undefined ? null : String(row.media_id),
        x: typeof row.focal_x === "number" ? row.focal_x : 0.5,
        y: typeof row.focal_y === "number" ? row.focal_y : 0.5,
        ...(parseFocalByViewport(row.focal_by_viewport) ? { byViewport: parseFocalByViewport(row.focal_by_viewport) } : {}),
      }] as const]
    : []));
}

const readPageImageFocals = (db: ReadDatabase, id: unknown) => readImageFocals(db, "pages", id);

function focalMatchesAsset(focal: StoredFocal | undefined, assetId: unknown): focal is StoredFocal {
  return Boolean(focal && focal.mediaId && assetId !== null && assetId !== undefined && focal.mediaId === String(assetId));
}

function publicImageFocal(focal: StoredFocal | undefined, assetId: unknown) {
  return focalMatchesAsset(focal, assetId) ? {
    focalX: focal.x,
    focalY: focal.y,
    ...(focal.byViewport ? { focalByViewport: focal.byViewport } : {}),
  } : undefined;
}

function shopCarouselFocalPath(categoryId: unknown): string {
  const encoded = encodeURIComponent(String(categoryId)).replaceAll(".", "%2E");
  return `catalog.tiles.@categoryId=${encoded}.carouselImage`;
}

function shopIconFocalPath(categoryId: unknown): string {
  const encoded = encodeURIComponent(String(categoryId)).replaceAll(".", "%2E");
  return `catalog.tiles.@categoryId=${encoded}.icon`;
}

function productVariantFocalPath(variantId: unknown): string {
  const encoded = encodeURIComponent(String(variantId)).replaceAll(".", "%2E");
  return `variants.@variantId=${encoded}.image`;
}

async function readGalleryAssets(db: ReadDatabase, table: keyof typeof GALLERY_TABLES, parentId: unknown, path: string) {
  const legacyFocalColumns = table === "products_variants_rels" ? ", rels.focal_x, rels.focal_y" : "";
  const rows = await db.query(
    `SELECT rels.media_id::text AS media_id, media.url AS image_url${legacyFocalColumns}
     FROM ${table} AS rels JOIN media ON media.id = rels.media_id
     WHERE rels.parent_id = $1 AND rels.path = $2
     ORDER BY rels."order", rels.id`,
    [parentId, path],
  );
  return rows.flatMap((row) => {
    const url = normalizeImageUrl(typeof row.image_url === "string" ? row.image_url : null);
    return url ? [{ mediaId: String(row.media_id), url, focalX: row.focal_x, focalY: row.focal_y }] : [];
  });
}

export const PUBLIC_STUB_PAGE_KEYS = [
  "about",
  "contact",
  "warranty",
  "branding",
  "become-a-supplier",
  "delivery-geography",
  "privacy-policy",
  "shop-delivery-returns",
  "delivery",
  "payment",
  "shop-delivery",
  "shop-payment",
  "shop-warranty",
  "shop-become-a-supplier",
] as const;

function readStringColumn(rows: Record<string, unknown>[], column: string): string[] {
  return rows.flatMap((row) => (typeof row[column] === "string" ? [row[column]] : []));
}

const GALLERY_TABLES = {
  tire_models_rels: true,
  wheel_models_rels: true,
  products_rels: true,
  products_variants_rels: true,
} as const;

async function readPublishedDocuments(
  db: ReadDatabase,
  entityType: "page" | "tire-model" | "wheel-model",
  entityId: unknown,
): Promise<{ url: string; title: string }[]> {
  const rows = await db.query(
    `SELECT media.url, links.title
     FROM cms_document_links AS links
     JOIN media ON media.id = links.media_id
     WHERE links.entity_type = $1 AND links.entity_id = $2
     ORDER BY links.sort_order, links.id`,
    [entityType, String(entityId)],
  );
  return mapPublishedDocuments(rows);
}

async function readGalleryUrls(
  db: ReadDatabase,
  table: keyof typeof GALLERY_TABLES,
  parentId: unknown,
  path = "gallery",
): Promise<string[]> {
  const rows = await db.query(
    `
      SELECT media.url AS image_url
      FROM ${table} AS rels
      JOIN media ON media.id = rels.media_id
      WHERE rels.parent_id = $1 AND rels.path = $2
      ORDER BY rels."order", rels.id
    `,
    [parentId, path],
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

  return Promise.all(tireTypeRows.map(async (tireTypeRow) => {
    const focals = await readImageFocals(db, "tire-directions", tireTypeRow.id);
    const focalRow = focals.get("mainImage");
    const focal = focalMatchesAsset(focalRow, tireTypeRow.cover_image_id) ? focalRow : undefined;
    return mapTireType({
      ...tireTypeRow,
      ...(focal ? { image_focal_x: focal.x, image_focal_y: focal.y, image_focal_by_viewport: focal.byViewport } : {}),
    } as Parameters<typeof mapTireType>[0]);
  }));
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
      ORDER BY COALESCE(tire_models.menu_order, 0), tire_models.name, tire_models.id
    `,
    [typeSlug],
  );

  return Promise.all(
    modelRows.map(async (modelRow) => {
      const [axleRows, featureRows, gallery, applicationRows, documents, focals] = await Promise.all([
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
        readGalleryAssets(db, "tire_models_rels", modelRow.id, "gallery"),
        db.query("SELECT value FROM tire_models_application_types WHERE parent_id = $1", [modelRow.id]),
        readPublishedDocuments(db, "tire-model", modelRow.id),
        readImageFocals(db, "tire-models", modelRow.id),
      ]);
      const galleryFocals = gallery.map((asset, index) => publicImageFocal(focals.get(`gallery.${index}`), asset.mediaId) ?? null);
      const mainFocal = publicImageFocal(focals.get("mainImage"), modelRow.main_image_id);

      return mapTireModel({
        row: modelRow as Parameters<typeof mapTireModel>[0]["row"],
        tireType: {
          slug: modelRow.tire_type_slug as string,
          name: modelRow.tire_type_name as string,
        },
        imageUrl: typeof modelRow.image_url === "string" ? modelRow.image_url : null,
        gallery: gallery.map((asset) => asset.url),
        imageFocal: mainFocal ? { x: mainFocal.focalX!, y: mainFocal.focalY!, byViewport: mainFocal.focalByViewport } : undefined,
        galleryFocals,
        advantages: featureRows.map(({ key, title, description }) => ({ key, title, description })),
        selectionAxles: readStringColumn(axleRows, "value"),
        applicationTypes: readStringColumn(applicationRows, "value"),
        documents,
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

  const [axleRows, featureRows, gallery, applicationRows, documents, focals] = await Promise.all([
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
    readGalleryAssets(db, "tire_models_rels", modelRow.id, "gallery"),
    db.query("SELECT value FROM tire_models_application_types WHERE parent_id = $1", [modelRow.id]),
    readPublishedDocuments(db, "tire-model", modelRow.id),
    readImageFocals(db, "tire-models", modelRow.id),
  ]);
  const galleryFocals = gallery.map((asset, index) => publicImageFocal(focals.get(`gallery.${index}`), asset.mediaId) ?? null);
  const mainFocal = publicImageFocal(focals.get("mainImage"), modelRow.main_image_id);

  return mapTireModel({
    row: modelRow as Parameters<typeof mapTireModel>[0]["row"],
    tireType: {
      slug: modelRow.tire_type_slug as string,
      name: modelRow.tire_type_name as string,
    },
    imageUrl: typeof modelRow.image_url === "string" ? modelRow.image_url : null,
    gallery: gallery.map((asset) => asset.url),
    imageFocal: mainFocal ? { x: mainFocal.focalX!, y: mainFocal.focalY!, byViewport: mainFocal.focalByViewport } : undefined,
    galleryFocals,
    advantages: featureRows.map(({ key, title, description }) => ({ key, title, description })),
    selectionAxles: readStringColumn(axleRows, "value"),
    applicationTypes: readStringColumn(applicationRows, "value"),
    documents,
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
      pages.home_hero_metric_text, pages.home_hero_image_alt, pages.home_hero_image_id::text AS home_hero_image_media_id, hero_media.url AS home_hero_image_url,
      pages.home_shop_campaign_eyebrow, pages.home_shop_campaign_title, pages.home_shop_campaign_lead,
      pages.home_shop_campaign_image_alt, pages.home_shop_campaign_cta_label, pages.home_shop_campaign_cta_href,
      pages.home_shop_campaign_image_id::text AS home_shop_campaign_image_media_id, campaign_media.url AS home_shop_campaign_image_url,
      pages.home_directions_eyebrow, pages.home_directions_title, pages.home_directions_lead,
      pages.home_expertise_eyebrow, pages.home_expertise_title, pages.home_expertise_lead,
      pages.home_expertise_image_alt, pages.home_expertise_cta_label, pages.home_expertise_cta_href,
      pages.home_expertise_image_id::text AS home_expertise_image_media_id, expertise_media.url AS home_expertise_image_url,
      pages.home_branding_eyebrow, pages.home_branding_title, pages.home_branding_lead,
      pages.home_branding_cta_label, pages.home_branding_cta_href,
      pages.home_branding_before_caption, pages.home_branding_after_caption,
      pages.home_branding_before_image_alt, pages.home_branding_before_image_id::text AS home_branding_before_image_media_id, before_media.url AS home_branding_before_image_url,
        pages.home_branding_after_image_alt, pages.home_branding_after_image_id::text AS home_branding_after_image_media_id, after_media.url AS home_branding_after_image_url
    FROM pages
    LEFT JOIN media AS hero_media ON hero_media.id = pages.home_hero_image_id
    LEFT JOIN media AS campaign_media ON campaign_media.id = pages.home_shop_campaign_image_id
    LEFT JOIN media AS expertise_media ON expertise_media.id = pages.home_expertise_image_id
    LEFT JOIN media AS before_media ON before_media.id = pages.home_branding_before_image_id
    LEFT JOIN media AS after_media ON after_media.id = pages.home_branding_after_image_id
    WHERE pages.key = 'home' AND pages.status = 'published'
  `);

  if (!homeRow) return null;
  const focals = await readPageImageFocals(db, "home");
  const withFocal = (key: string, x: string, y: string, viewport: string, assetId: unknown) => {
    const focal = focals.get(key);
    if (!focalMatchesAsset(focal, assetId)) return {};
    return { [x]: focal.x, [y]: focal.y, ...(focal.byViewport ? { [viewport]: focal.byViewport } : {}) };
  };
  const home = mapHomePatch({
    ...homeRow,
    ...withFocal("hero.image", "home_hero_image_focal_x", "home_hero_image_focal_y", "home_hero_image_focal_by_viewport", homeRow.home_hero_image_media_id),
    ...withFocal("shopCampaign.image", "home_shop_campaign_image_focal_x", "home_shop_campaign_image_focal_y", "home_shop_campaign_image_focal_by_viewport", homeRow.home_shop_campaign_image_media_id),
    ...withFocal("expertise.image", "home_expertise_image_focal_x", "home_expertise_image_focal_y", "home_expertise_image_focal_by_viewport", homeRow.home_expertise_image_media_id),
    ...withFocal("branding.beforeImage", "home_branding_before_image_focal_x", "home_branding_before_image_focal_y", "home_branding_before_image_focal_by_viewport", homeRow.home_branding_before_image_media_id),
    ...withFocal("branding.afterImage", "home_branding_after_image_focal_x", "home_branding_after_image_focal_y", "home_branding_after_image_focal_by_viewport", homeRow.home_branding_after_image_media_id),
  } as Parameters<typeof mapHomePatch>[0]);
  const frames = (await readPublishedShopCampaignFrames(db)) ?? [];
  if (frames.length > 0) home.shopCampaign = { ...home.shopCampaign, frames };
  return home;
}

async function readPublishedShopCampaignFrames(db: ReadDatabase): Promise<NonNullable<HomePatch["shopCampaign"]>["frames"]> {
  const [draftRow] = await db.query(
    `SELECT draft FROM cms_drafts WHERE collection = 'pages' AND doc_id = 'home'`,
  );
  const frames = draftRow?.draft && typeof draftRow.draft === "object"
    ? (draftRow.draft as { shopCampaign?: { frames?: { assetId?: string }[] } }).shopCampaign?.frames
    : undefined;
  const assetIds = Array.isArray(frames)
    ? frames.flatMap((frame) => typeof frame?.assetId === "string" && frame.assetId ? [frame.assetId] : [])
    : [];
  if (assetIds.length === 0) return [];
  const media = await db.query(
    `SELECT id::text AS id, url FROM media WHERE id = ANY($1::int[])`,
    [assetIds.map((id) => Number(id))],
  );
  const mediaById = new Map(media.flatMap((row) => (
    typeof row.id === "string" && typeof row.url === "string" ? [[row.id, row.url] as const] : []
  )));
  return publishedShopCampaignFrames(draftRow?.draft, mediaById) ?? [];
}

export async function readShopHomePatch(db: ReadDatabase): Promise<ShopHomePatch | null> {
  const [row] = await db.query(`
    SELECT pages.id, pages.seo_seo_title, pages.seo_seo_description, pages.shop_hero_eyebrow, pages.shop_hero_title,
      pages.shop_hero_lead, pages.shop_hero_cta_label, pages.shop_hero_cta_href, pages.shop_hero_image_alt,
      media.url AS shop_hero_image_url,
      pages.shop_wheels_intro_kicker, pages.shop_wheels_intro_eyebrow, pages.shop_wheels_intro_title, pages.shop_wheels_intro_lead,
      pages.shop_vehicles_eyebrow, pages.shop_vehicles_title, pages.shop_vehicles_lead,
      pages.shop_vehicles_cta_label, pages.shop_vehicles_cta_href,
      pages.shop_catalog_eyebrow, pages.shop_catalog_title, pages.shop_catalog_lead, pages.shop_catalog_section_title,
      pages.shop_home_disk_carousel_caption
    FROM pages
    LEFT JOIN media ON media.id = pages.shop_hero_image_id
    WHERE pages.key = 'shop-home' AND pages.status = 'published'
  `);
  if (!row) return null;
  const parentId = row.id;
  const [carousel, catalogTiles, vehicles, orderSteps, focals] = await Promise.all([
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
        tiles._order AS sort_order, COALESCE(icon.url, legacy_image.url) AS icon_url,
        carousel.url AS carousel_image_url, tiles.carousel_image_media_id::text AS carousel_image_media_id,
        COALESCE(tiles.icon_media_id, tiles.image_media_id)::text AS icon_media_id, tiles.icon_alt,
        tiles.carousel_image_alt, tiles.carousel_visible,
        tiles.home_carousel_caption
       FROM pages_shop_catalog_tiles tiles
       JOIN shop_categories categories ON categories.id = tiles.category_id AND categories.status = 'published'
       LEFT JOIN media AS icon ON icon.id = tiles.icon_media_id
       LEFT JOIN media AS legacy_image ON legacy_image.id = tiles.image_media_id
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
    readPageImageFocals(db, "shop-home"),
  ]);
  const catalogTilesWithFocals = catalogTiles.map((tile, index) => {
    const stable = focals.get(shopCarouselFocalPath(tile.category_id));
    const legacy = focals.get(`catalog.tiles.${index}.carouselImage`);
    const focal = focalMatchesAsset(stable, tile.carousel_image_media_id)
      ? stable
      : focalMatchesAsset(legacy, tile.carousel_image_media_id) ? legacy : undefined;
    const iconPosition = focals.get(shopIconFocalPath(tile.category_id));
    const iconFocal = focalMatchesAsset(iconPosition, tile.icon_media_id) ? iconPosition : undefined;
    return focal || iconFocal ? {
      ...tile,
      ...(iconFocal ? {
        icon_focal_x: iconFocal.x,
        icon_focal_y: iconFocal.y,
        ...(iconFocal.byViewport ? { icon_focal_by_viewport: iconFocal.byViewport } : {}),
      } : {}),
      ...(focal ? {
      carousel_image_focal_x: focal.x,
      carousel_image_focal_y: focal.y,
      ...(focal.byViewport ? { carousel_image_focal_by_viewport: focal.byViewport } : {}),
      } : {}),
    } : tile;
  });
  return mapShopHomePatch({
    row: row as Parameters<typeof mapShopHomePatch>[0]["row"],
    carousel: carousel as Parameters<typeof mapShopHomePatch>[0]["carousel"],
    vehicles: vehicles as Parameters<typeof mapShopHomePatch>[0]["vehicles"],
    orderSteps,
    catalogTiles: catalogTilesWithFocals as Parameters<typeof mapShopHomePatch>[0]["catalogTiles"],
  });
}

export async function readArticles(db: ReadDatabase): Promise<CmsArticle[]> {
  const articleRows = await db.query(`
    SELECT tire_iq_articles.*, media.url AS image_url,
      ARRAY(SELECT taxonomy.value FROM tire_iq_articles_taxonomy taxonomy
        WHERE taxonomy.parent_id = tire_iq_articles.id ORDER BY taxonomy."order") AS taxonomy
    FROM tire_iq_articles
    LEFT JOIN media ON media.id = tire_iq_articles.featured_image_id
    WHERE tire_iq_articles.status = 'published'
    ORDER BY COALESCE(tire_iq_articles.menu_order, 0), tire_iq_articles.published_at DESC NULLS LAST, tire_iq_articles.id
  `);

  return Promise.all(articleRows.map((articleRow) => mapPublishedArticle(db, articleRow)));
}

async function mapPublishedArticle(db: ReadDatabase, row: Record<string, unknown>): Promise<CmsArticle> {
  const focals = await readImageFocals(db, "materials", `article-${row.id}`);
  const focalRow = focals.get("image");
  const focal = focalMatchesAsset(focalRow, row.featured_image_id) ? focalRow : undefined;
  return mapArticle({
    ...row,
    ...(focal ? { image_focal_x: focal.x, image_focal_y: focal.y, image_focal_by_viewport: focal.byViewport } : {}),
  } as Parameters<typeof mapArticle>[0]);
}

export async function readArticleBySlug(
  db: ReadDatabase,
  slug: string,
): Promise<CmsArticle | null> {
  const [articleRow] = await db.query(
    `
      SELECT tire_iq_articles.*, media.url AS image_url,
        ARRAY(SELECT taxonomy.value FROM tire_iq_articles_taxonomy taxonomy
          WHERE taxonomy.parent_id = tire_iq_articles.id ORDER BY taxonomy."order") AS taxonomy
      FROM tire_iq_articles
      LEFT JOIN media ON media.id = tire_iq_articles.featured_image_id
      WHERE tire_iq_articles.status = 'published' AND tire_iq_articles.slug = $1
    `,
    [slug],
  );

  return articleRow ? mapPublishedArticle(db, articleRow) : null;
}

const STUB_PAGE_KEYS = new Set<string>(PUBLIC_STUB_PAGE_KEYS);

export async function readStubPatch(db: ReadDatabase, key: string): Promise<StubPatch | null> {
  if (!STUB_PAGE_KEYS.has(key)) return null;
  const [row] = await db.query(
    `
      SELECT pages.id, pages.stub_hero_configured, pages.editorial_heading_configured, pages.editorial_features_configured, pages.editorial_sections_configured, pages.editorial_notice_configured, pages.editorial_proof_configured, pages.editorial_cta_configured, pages.editorial_configured, pages.editorial_features_heading, pages.editorial_notice, pages.editorial_proof_title, pages.editorial_proof_text, pages.editorial_proof_image_alt, pages.editorial_cta_label, pages.editorial_cta_href, pages.editorial_secondary_label, pages.editorial_secondary_href, proof_media.url AS editorial_proof_image_url, pages.seo_seo_title, pages.seo_seo_description, pages.stub_hero_eyebrow, pages.stub_hero_title,
        pages.stub_hero_lead, pages.stub_hero_image_alt, media.url AS stub_hero_image_url,
        pages.stub_hero_image_id::text AS stub_hero_image_media_id, pages.editorial_proof_image_id::text AS editorial_proof_image_media_id,
        pages.footer_phone, pages.footer_email, pages.footer_address,
        pages.footer_telegram, pages.footer_whatsapp, pages.footer_max, pages.footer_vk, pages.footer_instagram
      FROM pages
      LEFT JOIN media ON media.id = pages.stub_hero_image_id
      LEFT JOIN media AS proof_media ON proof_media.id = pages.editorial_proof_image_id
      WHERE pages.key = $1 AND pages.status = 'published'
    `,
    [key],
  );
  if (!row) return null;
  const focalByPath = await readPageImageFocals(db, key);
  const heroFocal = focalByPath.get("hero.image");
  const proofFocal = focalByPath.get("proof.image");
  const features = row.editorial_configured ? await db.query(`SELECT id, title, text FROM pages_editorial_features WHERE _parent_id = $1 ORDER BY _order, id`, [row.id]) : [];
  const sections = row.editorial_configured ? await db.query(`SELECT id, heading, body FROM pages_editorial_sections WHERE _parent_id = $1 ORDER BY _order, id`, [row.id]) : [];
  const documents = await readPublishedDocuments(db, "page", key);
  const siteProfile = key === "contact" ? await readSiteProfile(db) : undefined;
  const pageForm = isPageFormKey(key) ? await loadPageForm(db, key) : undefined;
  const patch = mapStubPatch({
    ...row,
    site_profile: siteProfile,
    page_form: pageForm ?? undefined,
    ...(focalMatchesAsset(heroFocal, row.stub_hero_image_media_id) ? {
      stub_hero_image_focal_x: heroFocal.x,
      stub_hero_image_focal_y: heroFocal.y,
      stub_hero_image_focal_by_viewport: heroFocal.byViewport,
    } : {}),
    ...(focalMatchesAsset(proofFocal, row.editorial_proof_image_media_id) ? {
      editorial_proof_image_focal_x: proofFocal.x,
      editorial_proof_image_focal_y: proofFocal.y,
      editorial_proof_image_focal_by_viewport: proofFocal.byViewport,
    } : {}),
    features,
    sections,
    documents,
  } as unknown as Parameters<typeof mapStubPatch>[0]);
  if (key === "payment") return { ...patch, cartPath: "/cart" };
  if (key === "shop-payment") return { ...patch, cartPath: "/shop/cart" };
  return patch;
}

async function readWheelGallery(db: ReadDatabase, parentId: unknown) {
  const rows = await db.query(
    `
      SELECT rels.media_id::text AS media_id, media.url AS image_url, media.alt AS image_alt
      FROM wheel_models_rels AS rels
      JOIN media ON media.id = rels.media_id
      WHERE rels.parent_id = $1 AND rels.path = 'gallery'
      ORDER BY rels."order", rels.id
    `,
    [parentId],
  );
  return rows;
}

export async function readWheelTypes(db: ReadDatabase): Promise<CmsWheelType[]> {
  const rows = await db.query(`
    SELECT wheel_types.*, media.url AS image_url
    FROM wheel_types
    LEFT JOIN media ON media.id = wheel_types.cover_image_id
    WHERE wheel_types.status = 'published'
    ORDER BY wheel_types.sort_order, wheel_types.name
  `);
  return Promise.all(rows.map(async (row) => {
    const focals = await readImageFocals(db, "wheel-types", row.id);
    const focalRow = focals.get("mainImage");
    const focal = focalMatchesAsset(focalRow, row.cover_image_id) ? focalRow : undefined;
    return mapWheelType({
      ...row,
      ...(focal ? { image_focal_x: focal.x, image_focal_y: focal.y, image_focal_by_viewport: focal.byViewport } : {}),
    } as Parameters<typeof mapWheelType>[0]);
  }));
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
  const [galleryRows, documents, focals] = await Promise.all([
    readWheelGallery(db, row.id),
    readPublishedDocuments(db, "wheel-model", row.id),
    readImageFocals(db, "wheel-models", row.id),
  ]);
  const gallery = mapWheelGallery(galleryRows.map((asset, index) => {
    const focal = publicImageFocal(focals.get(`gallery.${index}`), asset.media_id);
    return {
      ...asset,
      ...(focal ? { image_focal_x: focal.focalX, image_focal_y: focal.focalY, image_focal_by_viewport: focal.focalByViewport } : {}),
    };
  }));
  const mainFocal = publicImageFocal(focals.get("mainImage"), row.main_image_id);
  return mapWheelModel(
    { ...row, ...(mainFocal ? { image_focal_x: mainFocal.focalX, image_focal_y: mainFocal.focalY, image_focal_by_viewport: mainFocal.focalByViewport } : {}) } as Parameters<typeof mapWheelModel>[0],
    typeof row.image_url === "string" ? row.image_url : null,
    gallery,
    documents,
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
    SELECT slides.shop_category_id, slides.image_id::text AS media_id, slides.title, media.url AS image_url
    FROM shop_category_carousel slides
    LEFT JOIN media ON media.id = slides.image_id
    ORDER BY slides.sort_order, slides.id
  `);
  const slidesByCategory = new Map<string, { media_id?: string | null; title?: string | null; image_url?: string | null }[]>();
  for (const slide of slides) {
    const categoryId = String(slide.shop_category_id);
    const frames = slidesByCategory.get(categoryId) ?? [];
    if (frames.length < 1) frames.push(slide);
    slidesByCategory.set(categoryId, frames);
  }
  return Promise.all(rows.map(async (row) => {
    const focals = await readImageFocals(db, "shop-categories", row.id);
    const mainFocal = publicImageFocal(focals.get("mainImage"), row.cover_image_id);
    const categorySlides = slidesByCategory.get(String(row.id)) ?? [];
    const carouselFocal = categorySlides[0]
      ? publicImageFocal(focals.get("carousel.0.image"), categorySlides[0].media_id)
      : undefined;
    return mapShopCategory({
      ...row,
      ...(mainFocal ? { image_focal_x: mainFocal.focalX, image_focal_y: mainFocal.focalY, image_focal_by_viewport: mainFocal.focalByViewport } : {}),
    } as Parameters<typeof mapShopCategory>[0], categorySlides.map((slide, index) => ({
      ...slide,
      ...(index === 0 && carouselFocal ? {
        image_focal_x: carouselFocal.focalX,
        image_focal_y: carouselFocal.focalY,
        image_focal_by_viewport: carouselFocal.focalByViewport,
      } : {}),
    })));
  }));
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
      ORDER BY COALESCE(products.sort_order, 0), products.name, products.id
    `,
    params,
  );
}

async function mapPublishedShopProduct(db: ReadDatabase, row: Record<string, unknown>) {
  const [variantRows, gallery, focals] = await Promise.all([
    db.query(
      "SELECT * FROM products_variants WHERE _parent_id = $1 ORDER BY _order, id",
      [row.id],
    ),
    readGalleryAssets(db, "products_rels", row.id, "gallery"),
    readImageFocals(db, "shop-products", row.id),
  ]);
  const mainFocalRow = focals.get("mainImage");
  const mainFocal = focalMatchesAsset(mainFocalRow, row.main_image_id)
    ? { x: mainFocalRow.x, y: mainFocalRow.y, byViewport: mainFocalRow.byViewport }
    : undefined;
  const galleryFocals = gallery.map((asset, index) => {
    const saved = focals.get(`gallery.${index}`);
    return focalMatchesAsset(saved, asset.mediaId) ? {
      focalX: saved.x,
      focalY: saved.y,
      ...(saved.byViewport ? { focalByViewport: saved.byViewport } : {}),
    } : null;
  });
  return mapShopProduct(
    row as Parameters<typeof mapShopProduct>[0],
    typeof row.image_url === "string" ? row.image_url : null,
    gallery.map((asset) => asset.url),
    await Promise.all(variantRows.map(async (variant) => {
      const assets = await readGalleryAssets(db, "products_variants_rels", variant.id, "image");
      const focal = focals.get(productVariantFocalPath(variant.id));
      const firstAsset = assets[0];
      const matchingFocal = focalMatchesAsset(focal, firstAsset?.mediaId) ? focal : undefined;
      return mapShopVariant(
        variant as Parameters<typeof mapShopVariant>[0],
        assets.map((asset) => asset.url),
        matchingFocal
          ? { x: matchingFocal.x, y: matchingFocal.y, byViewport: matchingFocal.byViewport }
        : {
          x: typeof firstAsset?.focalX === "number" ? firstAsset.focalX : undefined,
          y: typeof firstAsset?.focalY === "number" ? firstAsset.focalY : undefined,
        },
      );
    })),
    mainFocal,
    galleryFocals,
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
