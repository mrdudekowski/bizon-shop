import { Pool, type PoolClient } from "pg";
import { afterTransactionCommit, getTransactionClient, withTransaction } from "../../databaseTransaction";

import { AdminClientError } from "../client/errors";
import type { AdminClient } from "../client/adminClient";
import { hashPassword, parseCapabilities, resetUserPassword as resetAccountPassword, storedRole, type AuthenticatedAccount } from "./adminAuth";
import {
  articlePublishBlockers,
  shopProductPublishBlockers,
  tireDirectionPublishBlockers,
  tireModelPublishBlockers,
  wheelModelPublishBlockers,
  wheelTypePublishBlockers,
} from "../domain/publishRules";
import { isValidSlug, slugifyTitle } from "../domain/slug";
import type { CatalogAxle } from "../domain/options";
import type {
  AdminSession,
  AdminUser,
  ArticleDraft,
  ChangeSet,
  DocumentLink,
  EntityRecord,
  ImagePlacement,
  PageDraft,
  PageKey,
  MediaDeletionHistoryItem,
  PasswordResetHistoryItem,
  ShopCategoryDraft,
  ShopProductDraft,
  ShopSubcategoryDraft,
  ShopVariantDraft,
  StatusEntity,
  TireDirection,
  TireDirectionDraft,
  TireModelDraft,
  TireModelListItem,
  TireModelRecord,
  TireSizeDraft,
  WheelModelDraft,
  WheelTypeDraft,
  WheelVariantDraft,
} from "../domain/types";
import { PAGE_KEYS } from "../domain/types";
import { canEditorPerform, type EditorAction } from "../domain/editorPermissions";
import {
  cancelOverlappingPacks,
  recordEditorMutation,
  type ChangeSetState,
} from "../domain/applyChangeSet";
import {
  assertCanCancelChangeSet,
  assertCanPublishChangeSet,
  assertCanReturnChangeSet,
  assertCanSubmitChangeSet,
} from "../domain/changeSetTransitions";
import { assertDraftVersion } from "../domain/draftConcurrency";
import { publishPackAtomically } from "./publishPackAtomically";
import { getObjectStore } from "../../storage/objectStore";
import type { ObjectStore } from "../../storage/objectStore";
import { assertMediaUploadReady, MediaCleanupRequired, MediaRejected, uploadAndPersistMedia } from "../../storage/putMedia";
import { hasMediaReference, unlinkStoredMediaReferences, removePendingMediaReplacement } from "../../storage/mediaReferences";
import { collectPendingMediaReplacements } from "../domain/mediaReplacement";
import { shopHomeChildRows, shopHomeParentValues } from "../shopHomeWrite";

function databaseUri(): string {
  const connectionString = process.env.DATABASE_URI;
  if (!connectionString) throw new Error("DATABASE_URI is required");
  return connectionString;
}

let pool: Pool | null = null;

function getPool(): Pool {
  pool ??= new Pool({ connectionString: databaseUri() });
  return pool;
}

type Row = Record<string, unknown>;

function bufferFromUpload(file: { body?: Buffer; dataUrl?: string }): Buffer {
  if (file.body && file.body.length > 0) return file.body;
  const dataUrl = file.dataUrl;
  if (dataUrl?.startsWith("data:")) {
    const comma = dataUrl.indexOf(",");
    if (comma === -1) throw new MediaRejected("publish_blocked");
    return Buffer.from(dataUrl.slice(comma + 1), "base64");
  }
  throw new MediaRejected("publish_blocked");
}

function str(value: unknown): string {
  return value == null ? "" : String(value);
}

function num(value: unknown): number | undefined {
  if (value == null || value === "") return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function plainText(value: unknown): string {
  if (typeof value === "string") return value;
  if (value == null || typeof value !== "object") return "";
  const parts: string[] = [];
  const walk = (node: unknown) => {
    if (node == null || typeof node !== "object") return;
    const record = node as { text?: unknown; children?: unknown[] };
    if (typeof record.text === "string") parts.push(record.text);
    for (const child of record.children ?? []) walk(child);
  };
  walk((value as { root?: unknown }).root ?? value);
  return parts.join(" ").replace(/\s+/g, " ").trim();
}

function lexical(text: string): unknown {
  return {
    root: {
      type: "root",
      children: [{ type: "paragraph", children: [{ type: "text", text }] }],
    },
  };
}

function placement(assetId: unknown, alt = ""): ImagePlacement | undefined {
  if (assetId == null) return undefined;
  return {
    assetId: String(assetId),
    alt,
    focalX: 0.5,
    focalY: 0.5,
    crop: { x: 0, y: 0, width: 1, height: 1 },
  };
}

async function query(text: string, params: unknown[] = [], client?: PoolClient): Promise<Row[]> {
  const result = await (client ?? getTransactionClient() ?? getPool()).query(text, params);
  return result.rows as Row[];
}

async function retryQueuedMediaCleanup(store: ObjectStore): Promise<void> {
  const pending = await query(
    "SELECT object_key FROM cms_media_cleanup ORDER BY created_at LIMIT 20",
  );
  for (const row of pending) {
    const key = str(row.object_key);
    try {
      if (!key.startsWith("bizon/media/")) throw new Error("cleanup key outside CMS media prefix");
      await store.delete({ key });
      await query("DELETE FROM cms_media_cleanup WHERE object_key = $1", [key]);
    } catch {
      try {
        await query(
          "UPDATE cms_media_cleanup SET attempts = attempts + 1, last_attempt_at = now() WHERE object_key = $1",
          [key],
        );
      } catch {
        console.error("media.cleanup_attempt_record_failed", { key });
      }
      console.error("media.orphan_cleanup_retry_failed", { key });
    }
  }
}

async function applyPendingMediaReplacements(draft: unknown): Promise<void> {
  for (const replacement of collectPendingMediaReplacements(draft)) {
    const rows = await query(
      `SELECT target.id AS target_id, target.object_key AS old_key,
        staged.id AS staged_id, staged.title, staged.filename, staged.mime_type,
        staged.url, staged.object_key, staged.declared_mime_type, staged.sha256, staged.filesize
       FROM cms_media_replacements AS pending
       JOIN media AS target ON target.id = pending.target_media_id
       JOIN media AS staged ON staged.id = pending.staged_media_id
       WHERE pending.target_media_id = $1
       FOR UPDATE OF target, staged`,
      [Number(replacement.targetMediaId)],
    );
    const row = rows[0];
    // Another published placement may already have applied this shared replacement.
    if (!row) continue;
    const oldKey = str(row.old_key);
    if (oldKey.startsWith("bizon/media/")) {
      await query(
        `INSERT INTO cms_media_cleanup (object_key, reason)
         VALUES ($1, 'media_replaced') ON CONFLICT (object_key) DO NOTHING`,
        [oldKey],
      );
    }
    await query("DELETE FROM cms_media_replacements WHERE target_media_id = $1", [row.target_id]);
    await query("DELETE FROM media WHERE id = $1", [row.staged_id]);
    await query(
      `UPDATE media SET title=$2, filename=$3, mime_type=$4, url=$5, object_key=$6,
        declared_mime_type=$7, sha256=$8, filesize=$9 WHERE id=$1`,
      [row.target_id, row.title, row.title, row.mime_type, row.url, row.object_key, row.declared_mime_type, row.sha256, row.filesize],
    );
    if (oldKey.startsWith("bizon/media/")) {
      afterTransactionCommit(async () => {
        try {
          await getObjectStore().delete({ key: oldKey });
          await query("DELETE FROM cms_media_cleanup WHERE object_key = $1", [oldKey]);
        } catch {
          console.error("media.replaced_object_cleanup_queued", { key: oldKey });
        }
      });
    }
  }
}

function collectionOf(entityType: StatusEntity): string {
  switch (entityType) {
    case "tire-direction":
      return "tire-directions";
    case "tire-model":
      return "tire-models";
    case "wheel-type":
      return "wheel-types";
    case "wheel-model":
      return "wheel-models";
    case "shop-category":
      return "shop-categories";
    case "shop-product":
      return "shop-products";
    case "page":
      return "pages";
    case "material":
      return "materials";
  }
}

function entityTitle(draft: unknown, fallback: string): string {
  if (draft == null || typeof draft !== "object") return fallback;
  const record = draft as { name?: unknown; title?: unknown };
  if (typeof record.name === "string" && record.name.trim()) return record.name;
  if (typeof record.title === "string" && record.title.trim()) return record.title;
  return fallback;
}

async function publishEntry(client: AdminClient, entityType: StatusEntity, entityId: string): Promise<void> {
  switch (entityType) {
    case "tire-direction":
      await client.publishTireDirection(entityId);
      return;
    case "tire-model":
      await client.publishTireModel(entityId);
      return;
    case "wheel-type":
      await client.publishWheelType(entityId);
      return;
    case "wheel-model":
      await client.publishWheelModel(entityId);
      return;
    case "shop-category":
      await client.publishShopCategory(entityId);
      return;
    case "shop-product":
      await client.publishShopProduct(entityId);
      return;
    case "page":
      await client.publishPage(entityId as PageKey);
      return;
    case "material":
      await client.publishMaterial(entityId);
  }
}

async function restoreEntry(client: AdminClient, entry: { entityType: StatusEntity; entityId: string; operation: string; rollbackDraft: unknown }): Promise<void> {
  if (entry.operation === "create") {
    try {
      switch (entry.entityType) {
        case "tire-direction":
          await client.deleteTireDirection(entry.entityId);
          break;
        case "tire-model":
          await client.deleteTireModel(entry.entityId);
          break;
        case "wheel-type":
          await client.deleteWheelType(entry.entityId);
          break;
        case "wheel-model":
          await client.deleteWheelModel(entry.entityId);
          break;
        case "shop-category":
          await client.deleteShopCategory(entry.entityId);
          break;
        case "shop-product":
          await client.deleteShopProduct(entry.entityId);
          break;
        case "material":
          await client.deleteMaterial(entry.entityId);
          break;
        case "page":
          break;
      }
    } catch {
      if (entry.rollbackDraft != null) {
        await writeOverlay(collectionOf(entry.entityType), entry.entityId, entry.rollbackDraft);
      }
    }
    return;
  }
  if (entry.rollbackDraft != null) {
    await writeOverlay(collectionOf(entry.entityType), entry.entityId, entry.rollbackDraft);
  }
}

async function readOverlay<T>(collection: string, id: string): Promise<T | null> {
  const rows = await query("SELECT draft FROM cms_drafts WHERE collection = $1 AND doc_id = $2", [collection, id]);
  return (rows[0]?.draft as T | undefined) ?? null;
}

async function writeOverlay(collection: string, id: string, draft: unknown): Promise<void> {
  await query(
    `INSERT INTO cms_drafts (collection, doc_id, draft) VALUES ($1, $2, $3::jsonb)
     ON CONFLICT (collection, doc_id) DO UPDATE SET draft = EXCLUDED.draft`,
    [collection, id, JSON.stringify(draft)],
  );
}

async function clearOverlay(collection: string, id: string): Promise<void> {
  await query("DELETE FROM cms_drafts WHERE collection = $1 AND doc_id = $2", [collection, id]);
}

function wrap<T>(id: string, draft: T, status: string, publishedBody: T | null): EntityRecord<T> {
  const published = status === "published";
  return {
    id,
    draft,
    savedDraft: draft,
    publishedSnapshot: published ? publishedBody : null,
    hidden: status === "archived",
    slugLocked: published,
    lastSavedBy: null,
    lastPublishedBy: null,
  };
}

async function present<T>(collection: string, id: string, mapped: T, status: string): Promise<EntityRecord<T>> {
  const overlay = await readOverlay<T>(collection, id);
  const draft = overlay == null
    ? mapped
    : collection === "materials" && typeof overlay === "object" && overlay !== null
      ? { ...mapped as object, ...overlay as object,
          taxonomy: (overlay as { taxonomy?: unknown }).taxonomy ?? (mapped as { taxonomy?: unknown }).taxonomy } as T
      : overlay;
  return wrap(id, draft, status, mapped);
}

function documentStatus(record: { hidden: boolean; publishedSnapshot: unknown }): "draft" | "on_site" | "hidden" {
  if (record.hidden) return "hidden";
  if (record.publishedSnapshot != null) return "on_site";
  return "draft";
}

function sameJson(left: unknown, right: unknown): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

function isUniqueViolation(error: unknown): boolean {
  return error != null && typeof error === "object" && "code" in error && error.code === "23505";
}

function assertSaved<T>(record: EntityRecord<T>): T {
  if (record.savedDraft == null || !sameJson(record.draft, record.savedDraft)) {
    throw new AdminClientError("unsaved");
  }
  return record.savedDraft;
}

function numericId(id: string): number | null {
  return /^\d+$/.test(id) ? Number(id) : null;
}

async function valuesOf(table: string, parentColumn: string, parentId: number): Promise<string[]> {
  const rows = await query(`SELECT value FROM ${table} WHERE ${parentColumn} = $1 ORDER BY 1`, [parentId]);
  return rows.map((row) => str(row.value)).filter((value) => value.length > 0);
}

function mapSize(row: Row): TireSizeDraft {
  return {
    id: str(row.id),
    size: str(row.size) || str(row.size_normalized),
    sku: str(row.sku),
    price: num(row.price),
    priceOnRequest: row.price == null || Boolean(row.price_on_request),
    available: row.available !== false,
    rimDiameter: num(row.rim_diameter),
    loadIndex: str(row.load_index),
    loadIndexDual: str(row.load_index_dual),
    speedIndex: str(row.speed_index),
    plyRating: str(row.ply_rating),
    overallDiameter: num(row.overall_diameter),
    sectionWidth: num(row.section_width),
    treadDepth: num(row.tread_depth_mm),
    pressureSingleKpa: num(row.pressure_single_kpa),
    pressureDualKpa: num(row.pressure_dual_kpa),
    maxLoadSingleKg: num(row.max_load_single_kg),
    maxLoadDualKg: num(row.max_load_dual_kg),
    recommendedRim: str(row.recommended_rim),
  };
}

async function mapTireModel(row: Row): Promise<TireModelDraft> {
  const id = Number(row.id);
  const [sizes, features, gallery, positions, applications, vehicles, conditions, axles] = await Promise.all([
    query("SELECT * FROM tire_variants WHERE tire_model_id = $1 ORDER BY sort_order, id", [id]),
    query("SELECT * FROM tire_models_features WHERE _parent_id = $1 ORDER BY _order, id", [id]),
    query(
      `SELECT media_id FROM tire_models_rels WHERE parent_id = $1 AND path = 'gallery' ORDER BY "order", id`,
      [id],
    ),
    valuesOf("tire_models_positions", "parent_id", id),
    valuesOf("tire_models_application_types", "parent_id", id),
    valuesOf("tire_models_selection_vehicle_types", "parent_id", id),
    valuesOf("tire_models_selection_conditions", "parent_id", id),
    valuesOf("tire_models_selection_axles", "parent_id", id),
  ]);
  const axleValues = (axles.length > 0 ? axles : positions).filter(
    (value): value is CatalogAxle => value === "steer" || value === "drive" || value === "trailer",
  );
  return {
    id: str(row.id),
    name: str(row.name),
    slug: str(row.slug),
    directionId: str(row.tire_type_id),
    mainImage: placement(row.main_image_id),
    gallery: gallery.map((item) => placement(item.media_id)!).filter(Boolean),
    advantages: features
      .filter((feature) => !str(feature.id).startsWith("model-feature-"))
      .map((feature) => ({
        id: str(feature.id),
        title: str(feature.title),
        description: str(feature.description),
      })),
    documents: [] as DocumentLink[],
    sizes: sizes.map(mapSize),
    brand: str(row.series),
    descriptionShort: str(row.short_description),
    descriptionLong: plainText(row.full_description),
    treadType: str(row.tread_type),
    modelCode: str(row.model_code),
    features: features
      .filter((feature) => str(feature.id).startsWith("model-feature-"))
      .map((feature) => ({
      id: str(feature.id),
      key: str(feature.key),
      title: str(feature.title),
      description: str(feature.description),
    })),
    applicationTypes: applications,
    selectionVehicleTypes: vehicles as TireModelDraft["selectionVehicleTypes"],
    selectionConditions: conditions as TireModelDraft["selectionConditions"],
    selectionAxles: axleValues,
    showInMenu: Boolean(row.show_in_menu),
    menuOrder: num(row.menu_order) ?? 0,
  };
}

async function mapDirection(row: Row): Promise<TireDirectionDraft> {
  const id = Number(row.id);
  const [vehicles, conditions] = await Promise.all([
    valuesOf("tire_types_selection_vehicle_types", "parent_id", id),
    valuesOf("tire_types_selection_conditions", "parent_id", id),
  ]);
  return {
    id: str(row.id),
    name: str(row.name),
    slug: str(row.slug),
    description: str(row.description),
    shortDescription: str(row.short_description),
    sortOrder: num(row.sort_order) ?? 0,
    showInMenu: Boolean(row.show_in_menu),
    mainImage: placement(row.cover_image_id),
    selectionVehicleTypes: vehicles as TireDirectionDraft["selectionVehicleTypes"],
    selectionConditions: conditions as TireDirectionDraft["selectionConditions"],
  };
}

async function mapWheelModel(row: Row): Promise<WheelModelDraft> {
  const id = Number(row.id);
  const [variants, gallery] = await Promise.all([
    query("SELECT * FROM wheel_variants WHERE wheel_model_id = $1 ORDER BY sort_order, id", [id]),
    query("SELECT media_id FROM wheel_models_rels WHERE parent_id = $1 AND path = 'gallery' ORDER BY \"order\", id", [id]),
  ]);
  return {
    id: str(row.id),
    name: str(row.name),
    slug: str(row.slug),
    wheelTypeId: str(row.wheel_type_id),
    series: str(row.series),
    designStyle: str(row.design_style),
    material: str(row.material),
    constructionMethod: str(row.construction_method),
    fitmentNotes: str(row.fitment_notes),
    descriptionShort: str(row.short_description),
    descriptionLong: plainText(row.full_description),
    mainImage: placement(row.main_image_id),
    gallery: gallery.map((item) => placement(item.media_id)!).filter(Boolean),
    documents: [],
    showInMenu: Boolean(row.show_in_menu),
    menuOrder: num(row.menu_order) ?? 0,
    variants: variants.map(
      (variant): WheelVariantDraft => ({
        id: str(variant.id),
        sizeLabel: str(variant.size_label),
        pcd: str(variant.pcd),
        offsetET: num(variant.offset_e_t),
        centerBore: num(variant.center_bore),
        color: str(variant.color),
        price: num(variant.price),
        priceOnRequest: Boolean(variant.price_on_request),
        available: variant.available !== false,
      }),
    ),
  };
}

function mapWheelType(row: Row): WheelTypeDraft {
  return {
    id: str(row.id),
    name: str(row.name),
    slug: str(row.slug),
    description: str(row.description),
    mainImage: placement(row.cover_image_id),
    sortOrder: num(row.sort_order) ?? 0,
    showInMenu: false,
  };
}

async function mapProduct(row: Row): Promise<ShopProductDraft> {
  const [variants, gallery] = await Promise.all([
    query("SELECT * FROM products_variants WHERE _parent_id = $1 ORDER BY _order, id", [row.id]),
    query(`SELECT media_id FROM products_rels WHERE parent_id = $1 AND path = 'gallery' ORDER BY "order", id`, [row.id]),
  ]);
  return {
    id: str(row.id),
    name: str(row.name),
    slug: str(row.slug),
    categoryId: str(row.shop_category_id),
    subcategoryId: row.subcategory_id == null ? undefined : str(row.subcategory_id),
    descriptionShort: str(row.short_description),
    descriptionLong: plainText(row.full_description),
    price: num(row.price),
    priceOnRequest: Boolean(row.price_on_request),
    mainImage: placement(row.main_image_id),
    gallery: gallery.map((item) => placement(item.media_id)!).filter(Boolean),
    variants: variants.map(
      (variant): ShopVariantDraft => ({
        id: str(variant.id),
        color: str(variant.color),
        size: str(variant.size),
        sku: str(variant.sku),
        price: num(variant.price),
        priceOnRequest: Boolean(variant.price_on_request),
        available: variant.available !== false,
      }),
    ),
  };
}

async function mapCategory(row: Row): Promise<ShopCategoryDraft> {
  const slides = await query(
    "SELECT id, title, image_id FROM shop_category_carousel WHERE shop_category_id = $1 ORDER BY sort_order, id",
    [row.id],
  );
  return {
    id: str(row.id),
    name: str(row.name),
    slug: str(row.slug),
    description: str(row.description),
    mainImage: placement(row.cover_image_id),
    carousel: slides.slice(0, 1).map((slide) => ({
      id: str(slide.id),
      image: placement(slide.image_id),
    })),
    sortOrder: num(row.sort_order) ?? 0,
    showInMenu: Boolean(row.show_in_menu),
  };
}

function withCarousel(draft: ShopCategoryDraft | null): ShopCategoryDraft | null {
  if (draft == null) return null;
  const photo = (draft.carousel ?? []).find((slide) => slide.image);
  return {
    ...draft,
    carousel: photo?.image ? [{ id: photo.id, image: photo.image }] : [],
  };
}

async function presentCategory(row: Row, status = str(row.status)): Promise<EntityRecord<ShopCategoryDraft>> {
  const record = await present("shop-categories", str(row.id), await mapCategory(row), status);
  return {
    ...record,
    draft: withCarousel(record.draft)!,
    savedDraft: withCarousel(record.savedDraft),
    publishedSnapshot: withCarousel(record.publishedSnapshot),
  };
}

function mapArticle(row: Row): ArticleDraft {
  const taxonomy = Array.isArray(row.taxonomy)
    ? row.taxonomy.filter((value): value is string => typeof value === "string")
    : [];
  return {
    id: `article-${row.id}`,
    kind: "article",
    title: str(row.title),
    slug: str(row.slug),
    excerpt: str(row.excerpt),
    body: plainText(row.content),
    image: placement(row.featured_image_id),
    gallery: [],
    showInMenu: Boolean(row.show_in_menu),
    menuOrder: num(row.menu_order) ?? 0,
    taxonomy,
  };
}

function section(eyebrow: unknown, title: unknown, lead: unknown) {
  return { eyebrow: str(eyebrow), title: str(title), lead: str(lead) };
}

async function mapPage(row: Row): Promise<PageDraft> {
  const key = str(row.key) as PageKey;
  const seoTitle = str(row.seo_seo_title);
  const seoDescription = str(row.seo_seo_description);
  if (key === "home") {
    return {
      id: "home",
      seoTitle,
      seoDescription,
      hero: {
        ...section(row.home_hero_eyebrow, row.home_hero_title, row.home_hero_lead),
        image: placement(row.home_hero_image_id, str(row.home_hero_image_alt)),
        primaryCta: { label: str(row.home_hero_primary_cta_label), href: str(row.home_hero_primary_cta_href) },
        secondaryCta: { label: str(row.home_hero_secondary_cta_label), href: str(row.home_hero_secondary_cta_href) },
        metricLabel: str(row.home_hero_metric_label),
        metricText: str(row.home_hero_metric_text),
      },
      selectionEntry: {
        ...section(row.home_selection_entry_eyebrow, row.home_selection_entry_title, row.home_selection_entry_lead),
        image: placement(row.home_selection_entry_image_id, str(row.home_selection_entry_image_alt)),
      },
      directions: section(row.home_directions_eyebrow, row.home_directions_title, row.home_directions_lead),
      expertise: section(row.home_expertise_eyebrow, row.home_expertise_title, row.home_expertise_lead),
      shopCampaign: {
        ...section(row.home_shop_campaign_eyebrow, row.home_shop_campaign_title, row.home_shop_campaign_lead),
        image: placement(row.home_shop_campaign_image_id, str(row.home_shop_campaign_image_alt)),
        cta: { label: str(row.home_shop_campaign_cta_label), href: str(row.home_shop_campaign_cta_href) },
      },
      resume: {
        ...section(row.home_resume_eyebrow, row.home_resume_title, row.home_resume_lead),
        primaryCta: { label: str(row.home_resume_primary_cta_label), href: str(row.home_resume_primary_cta_href) },
        secondaryCta: { label: str(row.home_resume_secondary_cta_label), href: str(row.home_resume_secondary_cta_href) },
      },
    };
  }
  if (key === "shop-home") {
    const [steps, carousel, vehicles, catalogTiles] = await Promise.all([
      query("SELECT * FROM pages_shop_order_steps WHERE _parent_id = $1 ORDER BY _order", [row.id]),
      query("SELECT * FROM pages_shop_category_carousel WHERE _parent_id = $1 ORDER BY _order", [row.id]),
      query("SELECT * FROM pages_shop_vehicles_slides WHERE _parent_id = $1 ORDER BY _order", [row.id]),
      query("SELECT * FROM pages_shop_catalog_tiles WHERE _parent_id = $1 ORDER BY _order, id", [row.id]),
    ]);
    const legacyCatalogTiles = catalogTiles.length > 0
      ? catalogTiles
      : await query("SELECT id, name, sort_order, show_in_menu, cover_image_id FROM shop_categories ORDER BY sort_order, id");
    return {
      id: "shop-home",
      seoTitle,
      seoDescription,
      hero: {
        ...section(row.shop_hero_eyebrow, row.shop_hero_title, row.shop_hero_lead),
        image: placement(row.shop_hero_image_id, str(row.shop_hero_image_alt)),
        cta: { label: str(row.shop_hero_cta_label), href: str(row.shop_hero_cta_href) },
      },
      wheelsIntro: {
        ...section(row.shop_wheels_intro_eyebrow, row.shop_wheels_intro_title, row.shop_wheels_intro_lead),
        kicker: str(row.shop_wheels_intro_kicker),
      },
      orderSteps: steps.map((step) => ({ id: str(step.id), title: str(step.title), description: str(step.description) })),
      categoryCarousel: carousel.map((slide) => ({
        id: str(slide.id),
        kicker: str(slide.kicker),
        title: str(slide.title),
        action: str(slide.action),
        href: str(slide.href),
        alt: str(slide.alt),
        desktopImage: placement(slide.desktop_image_id),
        mobileImage: placement(slide.mobile_image_id),
      })),
      catalog: {
        copy: {
          eyebrow: str(row.shop_catalog_eyebrow),
          title: str(row.shop_catalog_title),
          lead: str(row.shop_catalog_lead),
          sectionTitle: str(row.shop_catalog_section_title),
        },
        tiles: legacyCatalogTiles.map((tile) => {
          const categoryId = str(tile.category_id ?? tile.id);
          const imageId = tile.image_media_id ?? tile.cover_image_id;
          const iconId = tile.icon_media_id ?? tile.cover_image_id;
          return {
            categoryId,
            title: str(tile.title ?? tile.name),
            visible: tile.visible == null ? Boolean(tile.show_in_menu) : Boolean(tile.visible),
            carouselVisible: Boolean(tile.carousel_visible),
            sortOrder: num(tile._order ?? tile.sort_order) ?? 0,
            icon: placement(iconId, str(tile.icon_alt ?? tile.name)),
            image: placement(imageId, str(tile.image_alt ?? tile.name)),
            carouselImage: placement(tile.carousel_image_media_id, str(tile.carousel_image_alt ?? tile.name)),
          };
        }),
      },
      vehicles: {
        ...section(row.shop_vehicles_eyebrow, row.shop_vehicles_title, row.shop_vehicles_lead),
        cta: { label: str(row.shop_vehicles_cta_label), href: str(row.shop_vehicles_cta_href) },
        slides: vehicles.map((slide) => ({
          id: str(slide.id),
          title: str(slide.title),
          alt: str(slide.alt),
          image: placement(slide.image_id),
        })),
      },
    };
  }
  return {
    id: key as Exclude<PageKey, "home" | "shop-home">,
    seoTitle,
    seoDescription,
    hero: {
      ...section(row.stub_hero_eyebrow, row.stub_hero_title, row.stub_hero_lead),
      image: placement(row.stub_hero_image_id, str(row.stub_hero_image_alt)),
    },
    documents: [],
  };
}

async function requireRow(table: string, id: string): Promise<Row> {
  const parsed = numericId(id);
  if (parsed == null) throw new AdminClientError("publish_blocked");
  const rows = await query(`SELECT * FROM ${table} WHERE id = $1`, [parsed]);
  const row = rows[0];
  if (row == null) throw new AdminClientError("publish_blocked");
  return row;
}

async function replaceValues(client: PoolClient, table: string, parentColumn: string, parentId: number, values: string[]) {
  await client.query(`DELETE FROM ${table} WHERE ${parentColumn} = $1`, [parentId]);
  for (const [index, value] of values.entries()) {
    await client.query(
      `INSERT INTO ${table} ("order", ${parentColumn}, value) VALUES ($1, $2, $3)`,
      [index, parentId, value],
    );
  }
}

export const TIRE_MODEL_PUBLISH_COLUMNS = [
  "name",
  "slug",
  "tire_type_id",
  "short_description",
  "full_description",
  "model_code",
  "show_in_menu",
  "menu_order",
  "status",
  "main_image_id",
  "tread_type",
  "series",
] as const;

async function replaceGallery(
  table: "tire_models_rels" | "wheel_models_rels" | "products_rels",
  parentId: number,
  images: { assetId: string }[],
  client?: PoolClient,
) {
  await query(`DELETE FROM ${table} WHERE parent_id = $1 AND path = 'gallery'`, [parentId], client);
  let order = 0;
  for (const image of images) {
    const mediaId = numericId(image.assetId);
    if (mediaId == null) continue;
    await query(
      `INSERT INTO ${table} ("order", parent_id, path, media_id) VALUES ($1, $2, 'gallery', $3)`,
      [order, parentId, mediaId],
      client,
    );
    order += 1;
  }
}

async function writeTireModel(client: PoolClient, draft: TireModelDraft, status: string) {
  const id = numericId(draft.id);
  if (id == null) throw new AdminClientError("publish_blocked");
  const description = plainText(draft.descriptionLong) === draft.descriptionLong ? lexical(draft.descriptionLong) : lexical(draft.descriptionLong);
  await client.query(
    `UPDATE tire_models SET name=$2, slug=$3, tire_type_id=$4, short_description=$5, full_description=$6::jsonb,
      model_code=$7, show_in_menu=$8, menu_order=$9, status=$10, main_image_id=$11,
      tread_type=$12, series=COALESCE(NULLIF($13, ''), series), updated_at=now()
     WHERE id=$1`,
    [
      id,
      draft.name,
      draft.slug,
      Number(draft.directionId),
      draft.descriptionShort,
      JSON.stringify(description),
      draft.modelCode || null,
      draft.showInMenu,
      draft.menuOrder,
      status,
      draft.mainImage ? Number(draft.mainImage.assetId) : null,
      draft.treadType || null,
      draft.brand,
    ],
  );
  for (const size of draft.sizes) {
    const sizeId = numericId(size.id);
    const fields = [
      size.size,
      size.sku || null,
      size.price ?? null,
      size.priceOnRequest,
      size.available,
      size.rimDiameter ?? null,
      size.loadIndex || null,
      size.speedIndex || null,
      size.plyRating || null,
      size.overallDiameter ?? null,
      size.sectionWidth ?? null,
      size.treadDepth ?? null,
      size.pressureSingleKpa ?? null,
      size.pressureDualKpa ?? null,
      size.maxLoadSingleKg ?? null,
      size.maxLoadDualKg ?? null,
      size.recommendedRim || null,
      status,
    ];
    if (sizeId == null) {
      await client.query(
        `INSERT INTO tire_variants (tire_model_id, size, sku, price, price_on_request, available, rim_diameter, load_index, speed_index, ply_rating, overall_diameter, section_width, tread_depth_mm, pressure_single_kpa, pressure_dual_kpa, max_load_single_kg, max_load_dual_kg, recommended_rim, status)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19)`,
        [id, ...fields],
      );
    } else {
      await client.query(
        `UPDATE tire_variants SET size=$2, sku=$3, price=$4, price_on_request=$5, available=$6, rim_diameter=$7, load_index=$8, speed_index=$9, ply_rating=$10, overall_diameter=$11, section_width=$12, tread_depth_mm=$13, pressure_single_kpa=$14, pressure_dual_kpa=$15, max_load_single_kg=$16, max_load_dual_kg=$17, recommended_rim=$18, status=$19, updated_at=now()
         WHERE id=$1`,
        [sizeId, ...fields],
      );
    }
  }
  const keptFeatureIds: string[] = [];
  for (const [index, feature] of (draft.features ?? []).entries()) {
    if (!feature.key) continue;
    keptFeatureIds.push(feature.id);
    const existing = await client.query("SELECT id FROM tire_models_features WHERE id = $1", [feature.id]);
    if (existing.rows.length > 0) {
      await client.query(
        "UPDATE tire_models_features SET title=$2, description=$3, key=$4, _order=$5 WHERE id=$1",
        [feature.id, feature.title, feature.description, feature.key, index],
      );
    } else {
      await client.query(
        `INSERT INTO tire_models_features (_order, _parent_id, id, key, title, description)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [index, id, feature.id, feature.key, feature.title, feature.description],
      );
    }
  }
  for (const [index, advantage] of draft.advantages.entries()) {
    if (!advantage.title.trim() && !advantage.description.trim()) continue;
    keptFeatureIds.push(advantage.id);
    const existing = await client.query("SELECT id FROM tire_models_features WHERE id = $1", [advantage.id]);
    if (existing.rows.length > 0) {
      await client.query(
        "UPDATE tire_models_features SET title=$2, description=$3, _order=$4 WHERE id=$1",
        [advantage.id, advantage.title, advantage.description, 100 + index],
      );
    } else {
      await client.query(
        `INSERT INTO tire_models_features (_order, _parent_id, id, key, title, description)
         VALUES ($1, $2, $3, 'handling', $4, $5)`,
        [100 + index, id, advantage.id, advantage.title, advantage.description],
      );
    }
  }
  if (keptFeatureIds.length === 0) {
    await client.query("DELETE FROM tire_models_features WHERE _parent_id = $1", [id]);
  } else {
    await client.query(
      "DELETE FROM tire_models_features WHERE _parent_id = $1 AND NOT (id = ANY($2::varchar[]))",
      [id, keptFeatureIds],
    );
  }
  await replaceGallery("tire_models_rels", id, draft.gallery, client);
  await replaceValues(client, "tire_models_positions", "parent_id", id, draft.selectionAxles);
  await replaceValues(client, "tire_models_application_types", "parent_id", id, draft.applicationTypes ?? []);
}

async function publishStatus(table: string, id: string, status: "published" | "archived" | "draft") {
  await query(`UPDATE ${table} SET status=$2, updated_at=now() WHERE id=$1`, [Number(id), status]);
}

export function createPostgresAdminClient(account: AuthenticatedAccount): AdminClient {
  const session: AdminSession = {
    login: account.login,
    role: account.role,
    capabilities: account.capabilities ?? [],
  };
  const actor: AdminUser = {
    id: account.id,
    login: account.login,
    role: account.role,
    disabled: false,
    capabilities: session.capabilities,
  };

  function requirePermission(action: EditorAction): void {
    if (!canEditorPerform(session, action)) throw new AdminClientError("forbidden");
  }

  async function loadPacks(): Promise<ChangeSet[]> {
    const rows = await query("SELECT pack FROM cms_change_sets");
    return rows.map((row) => row.pack as ChangeSet);
  }

  async function upsertPack(pack: ChangeSet): Promise<void> {
    await query(
      `INSERT INTO cms_change_sets (id, pack) VALUES ($1, $2::jsonb)
       ON CONFLICT (id) DO UPDATE SET pack = EXCLUDED.pack`,
      [pack.id, JSON.stringify(pack)],
    );
  }

  async function lockChangeSets(): Promise<void> {
    await query("SELECT pg_advisory_xact_lock(84201933, 1)");
  }

  async function mutatePacks(fn: (state: ChangeSetState) => void): Promise<ChangeSetState> {
    await lockChangeSets();
    const state: ChangeSetState = {
      session,
      users: [actor],
      changeSets: await loadPacks(),
      assets: [],
    };
    fn(state);
    for (const pack of state.changeSets) await upsertPack(pack);
    return state;
  }

  async function rememberMutation(input: Parameters<typeof recordEditorMutation>[1]): Promise<void> {
    await mutatePacks((state) => recordEditorMutation(state, input));
  }

  async function releaseLocks(entityType: StatusEntity, entityId: string): Promise<void> {
    await mutatePacks((state) => cancelOverlappingPacks(state, entityType, entityId, new Date(), session.login));
  }

  async function requirePack(id: string): Promise<ChangeSet> {
    const rows = await query("SELECT pack FROM cms_change_sets WHERE id = $1", [id]);
    const pack = rows[0]?.pack as ChangeSet | undefined;
    if (pack == null) throw new AdminClientError("publish_blocked");
    return pack;
  }

  const adminClient: AdminClient = {
    async getSession() {
      return session;
    },
    async storageNotice() {
      return null;
    },
    async listTireDirections() {
      const rows = await query("SELECT * FROM tire_types ORDER BY sort_order, name");
      const items: TireDirection[] = [];
      for (const row of rows) {
        const record = await present("tire-directions", str(row.id), await mapDirection(row), str(row.status));
        items.push({
          id: record.id,
          name: record.draft.name,
          slug: record.draft.slug,
          status: documentStatus(record),
          hasUnpublishedDraft: record.publishedSnapshot != null && !sameJson(record.draft, record.publishedSnapshot),
          imageAssetId: record.draft.mainImage?.assetId ?? null,
        });
      }
      return items;
    },
    async createTireDirection(input) {
      requirePermission("create_catalog_structure");
      const slug = slugifyTitle(input.name);
      if (!isValidSlug(slug)) throw new AdminClientError("invalid_slug");
      const rows = await query(
        "INSERT INTO tire_types (name, slug, status) VALUES ($1, $2, 'draft') RETURNING *",
        [input.name.trim(), slug],
      );
      const record = await present("tire-directions", str(rows[0].id), await mapDirection(rows[0]), "draft");
      await rememberMutation({
        entityType: "tire-direction",
        entityId: record.id,
        entityTitle: input.name.trim(),
        operation: "create",
        before: null,
        after: record.draft,
      });
      return record;
    },
    async getTireDirection(id) {
      const row = await requireRow("tire_types", id);
      return present("tire-directions", id, await mapDirection(row), str(row.status));
    },
    async saveTireDirection(id, draft, expectedSavedDraft?: unknown) {
      requirePermission("edit_catalog");
      if (!isValidSlug(draft.slug)) throw new AdminClientError("invalid_slug");
      const current = await this.getTireDirection(id);
      assertDraftVersion(expectedSavedDraft, current.savedDraft);
      const next = { ...draft, id };
      await writeOverlay("tire-directions", id, next);
      await rememberMutation({
        entityType: "tire-direction",
        entityId: id,
        entityTitle: entityTitle(next, id),
        operation: current.publishedSnapshot == null ? "create" : "update",
        before: current.savedDraft ?? current.publishedSnapshot,
        after: next,
      });
      return this.getTireDirection(id);
    },
    async publishTireDirection(id) {
      requirePermission("publish");
      const current = await this.getTireDirection(id);
      const draft = assertSaved(current);
      if (tireDirectionPublishBlockers(draft).length > 0) throw new AdminClientError("publish_blocked");
      await applyPendingMediaReplacements(draft);
      const transactionClient = getTransactionClient();
      const client = transactionClient ?? await getPool().connect();
      try {
        if (!transactionClient) await client.query("BEGIN");
        await client.query(
          "UPDATE tire_types SET name=$2, slug=$3, description=$4, short_description=$5, sort_order=$6, show_in_menu=$7, cover_image_id=$8, status='published', updated_at=now() WHERE id=$1",
          [
            Number(id),
            draft.name,
            draft.slug,
            draft.description,
            draft.shortDescription,
            draft.sortOrder,
            draft.showInMenu,
            draft.mainImage ? Number(draft.mainImage.assetId) : null,
          ],
        );
        await replaceValues(client, "tire_types_selection_vehicle_types", "parent_id", Number(id), draft.selectionVehicleTypes);
        await replaceValues(client, "tire_types_selection_conditions", "parent_id", Number(id), draft.selectionConditions);
        if (!transactionClient) await client.query("COMMIT");
      } catch (error) {
        if (!transactionClient) await client.query("ROLLBACK");
        throw error;
      } finally {
        if (!transactionClient) client.release();
      }
      await clearOverlay("tire-directions", id);
      await releaseLocks("tire-direction", id);
      return this.getTireDirection(id);
    },
    async hideTireDirection(id) {
      requirePermission("hide");
      await publishStatus("tire_types", id, "archived");
      return this.getTireDirection(id);
    },
    async deleteTireDirection(id) {
      requirePermission("delete");
      const children = await query("SELECT id FROM tire_models WHERE tire_type_id = $1 LIMIT 1", [Number(id)]);
      if (children.length > 0) throw new AdminClientError("publish_blocked");
      const row = await requireRow("tire_types", id);
      if (str(row.status) === "published") throw new AdminClientError("publish_blocked");
      await query("DELETE FROM tire_types WHERE id = $1", [Number(id)]);
    },
    async listTireModels() {
      const rows = await query("SELECT * FROM tire_models ORDER BY name");
      const items: TireModelListItem[] = [];
      for (const row of rows) {
        const record = await present("tire-models", str(row.id), await mapTireModel(row), str(row.status));
        const direction = await query("SELECT name FROM tire_types WHERE id = $1", [Number(record.draft.directionId)]);
        items.push({
          id: record.id,
          name: record.draft.name,
          directionId: record.draft.directionId,
          directionName: str(direction[0]?.name),
          sizeCount: record.draft.sizes.length,
          status: documentStatus(record),
          hasUnpublishedDraft: record.publishedSnapshot != null && !sameJson(record.draft, record.publishedSnapshot),
          imageAssetId: record.draft.mainImage?.assetId ?? null,
        });
      }
      return items;
    },
    async getTireModel(id) {
      const row = await requireRow("tire_models", id);
      return present("tire-models", id, await mapTireModel(row), str(row.status)) as Promise<TireModelRecord>;
    },
    async createTireModel(input) {
      requirePermission("create_catalog_items");
      const slug = slugifyTitle(input.name);
      if (!isValidSlug(slug)) throw new AdminClientError("invalid_slug");
      const rows = await query(
        "INSERT INTO tire_models (name, slug, tire_type_id, status) VALUES ($1, $2, $3, 'draft') RETURNING *",
        [input.name.trim(), slug, Number(input.directionId)],
      );
      const record = await present("tire-models", str(rows[0].id), await mapTireModel(rows[0]), "draft") as TireModelRecord;
      await rememberMutation({
        entityType: "tire-model",
        entityId: record.id,
        entityTitle: input.name.trim(),
        operation: "create",
        before: null,
        after: record.draft,
      });
      return record;
    },
    async saveTireModel(id, draft, expectedSavedDraft?: unknown) {
      requirePermission("edit_catalog");
      const currentRow = await requireRow("tire_models", id);
      if (str(currentRow.status) === "published" && draft.slug !== str(currentRow.slug)) throw new AdminClientError("invalid_slug");
      if (!isValidSlug(draft.slug)) throw new AdminClientError("invalid_slug");
      const current = await this.getTireModel(id);
      assertDraftVersion(expectedSavedDraft, current.savedDraft);
      const next = { ...draft, id };
      await writeOverlay("tire-models", id, next);
      await rememberMutation({
        entityType: "tire-model",
        entityId: id,
        entityTitle: entityTitle(next, id),
        operation: current.publishedSnapshot == null ? "create" : "update",
        before: current.savedDraft ?? current.publishedSnapshot,
        after: next,
      });
      return this.getTireModel(id);
    },
    async publishTireModel(id) {
      requirePermission("publish");
      const current = await this.getTireModel(id);
      const draft = assertSaved(current);
      const directions = await query("SELECT id FROM tire_types WHERE id = $1", [Number(draft.directionId)]);
      if (tireModelPublishBlockers(draft, directions.length > 0).length > 0) throw new AdminClientError("publish_blocked");
      await applyPendingMediaReplacements(draft);
      const transactionClient = getTransactionClient();
      const client = transactionClient ?? await getPool().connect();
      try {
        if (!transactionClient) await client.query("BEGIN");
        await writeTireModel(client, draft, "published");
        if (!transactionClient) await client.query("COMMIT");
      } catch (error) {
        if (!transactionClient) await client.query("ROLLBACK");
        throw error;
      } finally {
        if (!transactionClient) client.release();
      }
      await clearOverlay("tire-models", id);
      await releaseLocks("tire-model", id);
      return this.getTireModel(id);
    },
    async hideTireModel(id) {
      requirePermission("hide");
      await publishStatus("tire_models", id, "archived");
      return this.getTireModel(id);
    },
    async deleteTireModel(id) {
      requirePermission("delete");
      const row = await requireRow("tire_models", id);
      if (str(row.status) === "published") throw new AdminClientError("publish_blocked");
      await query("DELETE FROM tire_models WHERE id = $1", [Number(id)]);
    },
    async createAsset(file) {
      requirePermission("edit_catalog");
      const body = bufferFromUpload(file);
      try {
        const objectStore = getObjectStore();
        await assertMediaUploadReady(objectStore, () => query("SELECT 1"));
        await retryQueuedMediaCleanup(objectStore);
        return await uploadAndPersistMedia(
          objectStore,
          { name: file.name, mimeType: file.mimeType, body },
          async (stored) => {
            const rows = await query(
              "INSERT INTO media (title, alt, filename, mime_type, url, object_key, declared_mime_type, sha256, filesize) VALUES ($1, '', $1, $2, $3, $4, $5, $6, $7) RETURNING id",
              [stored.name, stored.mimeType, stored.url, stored.key, stored.declaredMimeType, stored.sha256, stored.byteSize],
            );
            return { id: str(rows[0].id) };
          },
          async (key) => {
            await query(
              "INSERT INTO cms_media_cleanup (object_key, reason) VALUES ($1, 'media_metadata_insert_failed') ON CONFLICT (object_key) DO NOTHING",
              [key],
            );
          },
        );
      } catch (error) {
        if (error instanceof MediaRejected) {
          if (error.code === "database_save_failed") {
            const cause = error.cause;
            console.error("media.metadata_save_failed", {
              error: cause instanceof Error ? cause.message : "unknown",
            });
          }
          throw new AdminClientError(error.code);
        }
        if (error instanceof MediaCleanupRequired) {
          console.error("media.cleanup_pending", { key: error.key, cleanupRecorded: error.cleanupRecorded });
          throw new AdminClientError("media_cleanup_pending");
        }
        throw new AdminClientError("database_unavailable");
      }
    },
    async replaceAsset(id, file) {
      requirePermission("edit_catalog");
      const targetId = numericId(id);
      if (targetId == null) throw new AdminClientError("publish_blocked");
      const body = bufferFromUpload(file);
      try {
        const objectStore = getObjectStore();
        await assertMediaUploadReady(objectStore, () => query("SELECT 1"));
        await retryQueuedMediaCleanup(objectStore);
        return await uploadAndPersistMedia(
          objectStore,
          { name: file.name, mimeType: file.mimeType, body },
          async (stored) => {
            if (!stored.mimeType.startsWith("image/")) throw new MediaRejected("publish_blocked");
            return withTransaction(getPool(), async () => {
            const target = await query("SELECT id FROM media WHERE id = $1 FOR UPDATE", [targetId]);
            if (target.length === 0) throw new AdminClientError("publish_blocked");
            const previous = await query(
              `SELECT staged.id, staged.object_key FROM cms_media_replacements AS pending
               JOIN media AS staged ON staged.id = pending.staged_media_id
               WHERE pending.target_media_id = $1 FOR UPDATE OF staged`,
              [targetId],
            );
            const inserted = await query(
              "INSERT INTO media (title, alt, filename, mime_type, url, object_key, declared_mime_type, sha256, filesize) VALUES ($1, '', $2, $3, $4, $5, $6, $7, $8) RETURNING id",
              [stored.name, stored.key.split("/").pop(), stored.mimeType, stored.url, stored.key, stored.declaredMimeType, stored.sha256, stored.byteSize],
            );
            const stagedId = str(inserted[0].id);
            await query(
              `INSERT INTO cms_media_replacements (target_media_id, staged_media_id)
               VALUES ($1, $2)
               ON CONFLICT (target_media_id) DO UPDATE SET staged_media_id = EXCLUDED.staged_media_id, created_at = now()`,
              [targetId, Number(stagedId)],
            );
            if (previous.length > 0) {
              const previousId = str(previous[0].id);
              const previousKey = str(previous[0].object_key);
              if (previousKey.startsWith("bizon/media/")) {
                await query(
                  `INSERT INTO cms_media_cleanup (object_key, reason)
                   VALUES ($1, 'media_replacement_superseded') ON CONFLICT (object_key) DO NOTHING`,
                  [previousKey],
                );
              }
              await query("DELETE FROM media WHERE id = $1", [Number(previousId)]);
              if (previousKey.startsWith("bizon/media/")) {
                afterTransactionCommit(async () => {
                  try {
                    await objectStore.delete({ key: previousKey });
                    await query("DELETE FROM cms_media_cleanup WHERE object_key = $1", [previousKey]);
                  } catch {
                    console.error("media.superseded_replacement_cleanup_queued", { key: previousKey });
                  }
                });
              }
            }
              return { id, replacementAssetId: stagedId };
            });
          },
          async (key) => {
            await query(
              "INSERT INTO cms_media_cleanup (object_key, reason) VALUES ($1, 'media_metadata_insert_failed') ON CONFLICT (object_key) DO NOTHING",
              [key],
            );
          },
        );
      } catch (error) {
        if (error instanceof MediaRejected) {
          if (error.code === "database_save_failed") {
            const cause = error.cause;
            console.error("media.replacement_metadata_save_failed", {
              error: cause instanceof Error ? cause.message : "unknown",
            });
          }
          throw new AdminClientError(error.code);
        }
        if (error instanceof MediaCleanupRequired) {
          console.error("media.replacement_cleanup_pending", { key: error.key, cleanupRecorded: error.cleanupRecorded });
          throw new AdminClientError("media_cleanup_pending");
        }
        if (error instanceof AdminClientError) throw error;
        throw new AdminClientError("database_unavailable");
      }
    },
    async cancelAssetReplacement(id) {
      requirePermission("edit_catalog");
      const targetId = numericId(id);
      if (targetId == null) throw new AdminClientError("publish_blocked");
      const staged = await query(
        `SELECT media.id, media.object_key FROM cms_media_replacements AS pending
         JOIN media ON media.id = pending.staged_media_id
         WHERE pending.target_media_id = $1 FOR UPDATE OF media`,
        [targetId],
      );
      if (staged.length === 0) return;
      const stagedId = str(staged[0].id);
      const key = str(staged[0].object_key);
      if (key.startsWith("bizon/media/")) {
        await query(
          `INSERT INTO cms_media_cleanup (object_key, reason)
           VALUES ($1, 'media_replacement_cancelled') ON CONFLICT (object_key) DO NOTHING`,
          [key],
        );
      }
      await query("DELETE FROM cms_media_replacements WHERE target_media_id = $1", [targetId]);
      await query("DELETE FROM media WHERE id = $1", [Number(stagedId)]);
      if (key.startsWith("bizon/media/")) {
        afterTransactionCommit(async () => {
          try {
            await getObjectStore().delete({ key });
            await query("DELETE FROM cms_media_cleanup WHERE object_key = $1", [key]);
          } catch {
            console.error("media.cancelled_replacement_cleanup_queued", { key });
          }
        });
      }
    },
    async listAssets() {
      const rows = await query(
        `SELECT media.id, COALESCE(staged.title, media.title) AS title,
          COALESCE(staged.title, media.filename) AS filename,
          COALESCE(staged.mime_type, media.mime_type) AS mime_type,
          COALESCE(staged.url, media.url) AS url,
          (staged.id IS NOT NULL) AS replacement_pending
         FROM media
         LEFT JOIN cms_media_replacements AS pending ON pending.target_media_id = media.id
         LEFT JOIN media AS staged ON staged.id = pending.staged_media_id
         WHERE NOT EXISTS (SELECT 1 FROM cms_media_replacements AS hidden WHERE hidden.staged_media_id = media.id)
         ORDER BY media.id`,
      );
      const drafts = await query("SELECT collection, doc_id, draft FROM cms_drafts");
      const changeSets = await query("SELECT id, pack FROM cms_change_sets");
      const result = [];
      for (const row of rows) {
        const id = str(row.id);
        const usedBy: string[] = [];
        const refs = await query(
          `SELECT label FROM (
             SELECT 'Тип шин: ' || name AS label FROM tire_types WHERE cover_image_id = $1
             UNION ALL SELECT 'Шина: ' || name FROM tire_models WHERE main_image_id = $1
             UNION ALL SELECT 'Тип дисков: ' || name FROM wheel_types WHERE cover_image_id = $1
             UNION ALL SELECT 'Модель дисков: ' || name FROM wheel_models WHERE main_image_id = $1
             UNION ALL SELECT 'Категория Shop: ' || name FROM shop_categories WHERE cover_image_id = $1
             UNION ALL SELECT 'Товар Shop: ' || name FROM products WHERE main_image_id = $1
             UNION ALL SELECT 'Материал Tire IQ: ' || title FROM tire_iq_articles WHERE featured_image_id = $1
             UNION ALL SELECT 'Карусель категории Shop: ' || c.name FROM shop_category_carousel AS s JOIN shop_categories AS c ON c.id = s.shop_category_id WHERE s.image_id = $1
             UNION ALL SELECT 'Главный экран сайта: ' || "key" FROM pages WHERE home_hero_image_id = $1
             UNION ALL SELECT 'Блок выбора шин на главной: ' || "key" FROM pages WHERE home_selection_entry_image_id = $1
             UNION ALL SELECT 'Рекламный блок Shop на главной: ' || "key" FROM pages WHERE home_shop_campaign_image_id = $1
             UNION ALL SELECT 'Обложка страницы Shop: ' || "key" FROM pages WHERE shop_hero_image_id = $1
             UNION ALL SELECT 'Обложка страницы-заглушки: ' || "key" FROM pages WHERE stub_hero_image_id = $1
             UNION ALL SELECT 'Изображение карусели Shop на странице' FROM pages_shop_category_carousel WHERE desktop_image_id = $1 OR mobile_image_id = $1
             UNION ALL SELECT 'Изображение слайда транспорта на странице' FROM pages_shop_vehicles_slides WHERE image_id = $1
             UNION ALL SELECT 'Элемент каталога Shop' FROM pages_shop_catalog_tiles WHERE icon_media_id = $1 OR image_media_id = $1 OR carousel_image_media_id = $1
             UNION ALL SELECT 'Материал Tire IQ: ' || title FROM tire_iq_articles WHERE featured_image_id = $1
             UNION ALL SELECT 'Галерея шины: ' || tire_models.name FROM tire_models_rels JOIN tire_models ON tire_models.id = tire_models_rels.parent_id WHERE media_id = $1
             UNION ALL SELECT 'Галерея дисков: ' || wheel_models.name FROM wheel_models_rels JOIN wheel_models ON wheel_models.id = wheel_models_rels.parent_id WHERE media_id = $1
             UNION ALL SELECT 'Галерея товара Shop: ' || products.name FROM products_rels JOIN products ON products.id = products_rels.parent_id WHERE media_id = $1
           ) AS usages`,
          [Number(id)],
        );
        for (const ref of refs) usedBy.push(str(ref.label));
        for (const draft of drafts) {
          if (hasMediaReference(draft.draft, id)) usedBy.push(`Черновик: ${str(draft.collection)} / ${str(draft.doc_id)}`);
        }
        for (const pack of changeSets) {
          if (hasMediaReference(pack.pack, id)) usedBy.push(`Пакет изменений: ${str(pack.id)}`);
        }
        result.push({
          id,
          name: str(row.filename || row.title),
          mimeType: str(row.mime_type),
          dataUrl: str(row.url),
          usedBy: [...new Set(usedBy)],
          replacementPending: row.replacement_pending === true,
        });
      }
      return result;
    },
    async deleteAsset(id) {
      requirePermission("delete");
      await query("SET TRANSACTION ISOLATION LEVEL SERIALIZABLE");
      const mediaRows = await query("SELECT object_key, filename, title, mime_type FROM media WHERE id = $1 FOR UPDATE", [Number(id)]);
      if (mediaRows.length === 0) return;
      const objectKey = str(mediaRows[0].object_key);
      if (!objectKey) throw new AdminClientError("media_storage_key_missing");
      await removePendingMediaReplacement(
        query,
        id,
        afterTransactionCommit,
        async (key) => getObjectStore().delete({ key }),
      );
      await unlinkStoredMediaReferences(query, id);
      await query(
        `INSERT INTO cms_media_cleanup (object_key, reason)
         VALUES ($1, 'media_delete_requested')
         ON CONFLICT (object_key) DO UPDATE SET reason = EXCLUDED.reason`,
        [objectKey],
      );
      await query("DELETE FROM media WHERE id = $1", [Number(id)]);
      await query(
        `INSERT INTO cms_media_deletion_history
          (media_id, filename, mime_type, object_key, deleted_by_user_id, deleted_by_login)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [String(id), str(mediaRows[0].filename || mediaRows[0].title), str(mediaRows[0].mime_type), objectKey, actor.id, actor.login],
      );
      afterTransactionCommit(async () => {
        try {
          await getObjectStore().delete({ key: objectKey });
          await query("DELETE FROM cms_media_cleanup WHERE object_key = $1", [objectKey]);
        } catch {
          console.error("media.delete_retry_queued", { key: objectKey });
        }
      });
    },
    async listMediaDeletionHistory(): Promise<MediaDeletionHistoryItem[]> {
      if (session.role !== "admin") throw new AdminClientError("forbidden");
      const rows = await query(
        "SELECT id, media_id, filename, deleted_by_login, deleted_at FROM cms_media_deletion_history ORDER BY deleted_at DESC, id DESC LIMIT 200",
      );
      return rows.map((row) => ({
        id: str(row.id),
        mediaId: str(row.media_id),
        filename: str(row.filename),
        deletedBy: str(row.deleted_by_login),
        deletedAt: new Date(str(row.deleted_at)).toISOString(),
      }));
    },
    async listWheelTypes() {
      const rows = await query("SELECT * FROM wheel_types ORDER BY sort_order, name");
      const records = [];
      for (const row of rows) records.push(await present("wheel-types", str(row.id), mapWheelType(row), str(row.status)));
      return records;
    },
    async getWheelType(id) {
      const row = await requireRow("wheel_types", id);
      return present("wheel-types", id, mapWheelType(row), str(row.status));
    },
    async createWheelType(input) {
      requirePermission("create_catalog_structure");
      const slug = slugifyTitle(input.name);
      if (!isValidSlug(slug)) throw new AdminClientError("invalid_slug");
      const rows = await query("INSERT INTO wheel_types (name, slug, status) VALUES ($1, $2, 'draft') RETURNING *", [
        input.name.trim(),
        slug,
      ]);
      const record = await present("wheel-types", str(rows[0].id), mapWheelType(rows[0]), "draft");
      await rememberMutation({
        entityType: "wheel-type",
        entityId: record.id,
        entityTitle: input.name.trim(),
        operation: "create",
        before: null,
        after: record.draft,
      });
      return record;
    },
    async saveWheelType(id, draft, expectedSavedDraft?: unknown) {
      requirePermission("edit_catalog");
      if (!isValidSlug(draft.slug)) throw new AdminClientError("invalid_slug");
      const current = await this.getWheelType(id);
      assertDraftVersion(expectedSavedDraft, current.savedDraft);
      const next = { ...draft, id };
      await writeOverlay("wheel-types", id, next);
      await rememberMutation({
        entityType: "wheel-type",
        entityId: id,
        entityTitle: entityTitle(next, id),
        operation: current.publishedSnapshot == null ? "create" : "update",
        before: current.savedDraft ?? current.publishedSnapshot,
        after: next,
      });
      return this.getWheelType(id);
    },
    async publishWheelType(id) {
      requirePermission("publish");
      const current = await this.getWheelType(id);
      const draft = assertSaved(current);
      if (wheelTypePublishBlockers(draft).length > 0) throw new AdminClientError("publish_blocked");
      await applyPendingMediaReplacements(draft);
      await query(
        "UPDATE wheel_types SET name=$2, slug=$3, description=$4, sort_order=$5, cover_image_id=$6, status='published', updated_at=now() WHERE id=$1",
        [Number(id), draft.name, draft.slug, draft.description, draft.sortOrder, draft.mainImage ? Number(draft.mainImage.assetId) : null],
      );
      await clearOverlay("wheel-types", id);
      await releaseLocks("wheel-type", id);
      return this.getWheelType(id);
    },
    async hideWheelType(id) {
      requirePermission("hide");
      await publishStatus("wheel_types", id, "archived");
      return this.getWheelType(id);
    },
    async deleteWheelType(id) {
      requirePermission("delete");
      const children = await query("SELECT id FROM wheel_models WHERE wheel_type_id = $1 LIMIT 1", [Number(id)]);
      if (children.length > 0) throw new AdminClientError("publish_blocked");
      const row = await requireRow("wheel_types", id);
      if (str(row.status) === "published") throw new AdminClientError("publish_blocked");
      await query("DELETE FROM wheel_types WHERE id = $1", [Number(id)]);
    },
    async listWheelModels() {
      const rows = await query("SELECT * FROM wheel_models ORDER BY name");
      const items = [];
      for (const row of rows) {
        const record = await present("wheel-models", str(row.id), await mapWheelModel(row), str(row.status));
        const type = await query("SELECT name FROM wheel_types WHERE id = $1", [Number(record.draft.wheelTypeId)]);
        items.push({
          id: record.id,
          name: record.draft.name,
          wheelTypeId: record.draft.wheelTypeId,
          typeName: str(type[0]?.name),
          status: documentStatus(record),
          hasUnpublishedDraft: record.publishedSnapshot != null && !sameJson(record.draft, record.publishedSnapshot),
          imageAssetId: record.draft.mainImage?.assetId ?? null,
        });
      }
      return items;
    },
    async createWheelModel(input) {
      requirePermission("create_catalog_items");
      const slug = slugifyTitle(input.name);
      if (!isValidSlug(slug)) throw new AdminClientError("invalid_slug");
      const rows = await query(
        "INSERT INTO wheel_models (name, slug, wheel_type_id, status) VALUES ($1, $2, $3, 'draft') RETURNING *",
        [input.name.trim(), slug, Number(input.wheelTypeId)],
      );
      const record = await present("wheel-models", str(rows[0].id), await mapWheelModel(rows[0]), "draft");
      await rememberMutation({
        entityType: "wheel-model",
        entityId: record.id,
        entityTitle: input.name.trim(),
        operation: "create",
        before: null,
        after: record.draft,
      });
      return record;
    },
    async getWheelModel(id) {
      const row = await requireRow("wheel_models", id);
      return present("wheel-models", id, await mapWheelModel(row), str(row.status));
    },
    async saveWheelModel(id, draft, expectedSavedDraft?: unknown) {
      requirePermission("edit_catalog");
      if (!isValidSlug(draft.slug)) throw new AdminClientError("invalid_slug");
      const current = await this.getWheelModel(id);
      assertDraftVersion(expectedSavedDraft, current.savedDraft);
      const next = { ...draft, id };
      await writeOverlay("wheel-models", id, next);
      await rememberMutation({
        entityType: "wheel-model",
        entityId: id,
        entityTitle: entityTitle(next, id),
        operation: current.publishedSnapshot == null ? "create" : "update",
        before: current.savedDraft ?? current.publishedSnapshot,
        after: next,
      });
      return this.getWheelModel(id);
    },
    async publishWheelModel(id) {
      requirePermission("publish");
      const current = await this.getWheelModel(id);
      const draft = assertSaved(current);
      const types = await query("SELECT id FROM wheel_types WHERE id = $1", [Number(draft.wheelTypeId)]);
      if (wheelModelPublishBlockers(draft, types.length > 0).length > 0) throw new AdminClientError("publish_blocked");
      await applyPendingMediaReplacements(draft);
      const transactionClient = getTransactionClient();
      const client = transactionClient ?? await getPool().connect();
      try {
        if (!transactionClient) await client.query("BEGIN");
        await client.query(
          `UPDATE wheel_models SET name=$2, slug=$3, wheel_type_id=$4, series=$5, design_style=$6, material=$7, construction_method=$8, fitment_notes=$9, short_description=$10, full_description=$11::jsonb, main_image_id=$12, show_in_menu=$13, menu_order=$14, status='published', updated_at=now() WHERE id=$1`,
          [
            Number(id),
            draft.name,
            draft.slug,
            Number(draft.wheelTypeId),
            draft.series,
            draft.designStyle || null,
            draft.material,
            draft.constructionMethod || null,
            draft.fitmentNotes,
            draft.descriptionShort,
            JSON.stringify(lexical(draft.descriptionLong)),
            draft.mainImage ? Number(draft.mainImage.assetId) : null,
            draft.showInMenu,
            draft.menuOrder,
          ],
        );
        const keptVariantIds: number[] = [];
        for (const variant of draft.variants) {
          const variantId = numericId(variant.id);
          const values = [
            variant.sizeLabel,
            variant.pcd,
            variant.offsetET ?? null,
            variant.centerBore ?? null,
            variant.color,
            variant.price ?? null,
            variant.priceOnRequest,
            variant.available,
          ];
          if (variantId == null) {
            const inserted = await client.query(
              `INSERT INTO wheel_variants (wheel_model_id, size_label, pcd, offset_e_t, center_bore, color, price, price_on_request, available, status)
               VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'published') RETURNING id`,
              [Number(id), ...values],
            );
            keptVariantIds.push(Number(inserted.rows[0].id));
          } else {
            await client.query(
              "UPDATE wheel_variants SET size_label=$2, pcd=$3, offset_e_t=$4, center_bore=$5, color=$6, price=$7, price_on_request=$8, available=$9, status='published', updated_at=now() WHERE id=$1",
              [variantId, ...values],
            );
            keptVariantIds.push(variantId);
          }
        }
        if (keptVariantIds.length === 0) {
          await client.query("DELETE FROM wheel_variants WHERE wheel_model_id = $1", [Number(id)]);
        } else {
          await client.query(
            "DELETE FROM wheel_variants WHERE wheel_model_id = $1 AND NOT (id = ANY($2::int[]))",
            [Number(id), keptVariantIds],
          );
        }
        await replaceGallery("wheel_models_rels", Number(id), draft.gallery, client);
        if (!transactionClient) await client.query("COMMIT");
      } catch (error) {
        if (!transactionClient) await client.query("ROLLBACK");
        throw error;
      } finally {
        if (!transactionClient) client.release();
      }
      await clearOverlay("wheel-models", id);
      await releaseLocks("wheel-model", id);
      return this.getWheelModel(id);
    },
    async hideWheelModel(id) {
      requirePermission("hide");
      await publishStatus("wheel_models", id, "archived");
      return this.getWheelModel(id);
    },
    async deleteWheelModel(id) {
      requirePermission("delete");
      const row = await requireRow("wheel_models", id);
      if (str(row.status) === "published") throw new AdminClientError("publish_blocked");
      await query("DELETE FROM wheel_models WHERE id = $1", [Number(id)]);
    },
    async listShopCategories() {
      const rows = await query("SELECT * FROM shop_categories ORDER BY sort_order, name");
      const records = [];
      for (const row of rows) records.push(await presentCategory(row));
      return records;
    },
    async getShopCategory(id) {
      const row = await requireRow("shop_categories", id);
      return presentCategory(row);
    },
    async createShopCategory(input) {
      requirePermission("create_catalog_structure");
      const slug = slugifyTitle(input.name);
      if (!isValidSlug(slug)) throw new AdminClientError("invalid_slug");
      const rows = await query("INSERT INTO shop_categories (name, slug, status) VALUES ($1, $2, 'draft') RETURNING *", [
        input.name.trim(),
        slug,
      ]);
      const record = await presentCategory(rows[0], "draft");
      await rememberMutation({
        entityType: "shop-category",
        entityId: record.id,
        entityTitle: input.name.trim(),
        operation: "create",
        before: null,
        after: record.draft,
      });
      return record;
    },
    async saveShopCategory(id, draft, expectedSavedDraft?: unknown) {
      requirePermission("edit_catalog");
      if (!isValidSlug(draft.slug)) throw new AdminClientError("invalid_slug");
      const current = await this.getShopCategory(id);
      assertDraftVersion(expectedSavedDraft, current.savedDraft);
      const next = { ...draft, id };
      await writeOverlay("shop-categories", id, next);
      await rememberMutation({
        entityType: "shop-category",
        entityId: id,
        entityTitle: entityTitle(next, id),
        operation: current.publishedSnapshot == null ? "create" : "update",
        before: current.savedDraft ?? current.publishedSnapshot,
        after: next,
      });
      return this.getShopCategory(id);
    },
    async publishShopCategory(id) {
      requirePermission("publish");
      const current = await this.getShopCategory(id);
      const draft = assertSaved(current);
      if (wheelTypePublishBlockers(draft).length > 0) throw new AdminClientError("publish_blocked");
      await applyPendingMediaReplacements(draft);
      await query(
        "UPDATE shop_categories SET name=$2, slug=$3, description=$4, sort_order=$5, show_in_menu=$6, cover_image_id=$7, status='published', updated_at=now() WHERE id=$1",
        [Number(id), draft.name, draft.slug, draft.description, draft.sortOrder, draft.showInMenu, draft.mainImage ? Number(draft.mainImage.assetId) : null],
      );
      await query("DELETE FROM shop_category_carousel WHERE shop_category_id = $1", [Number(id)]);
      const photo = (draft.carousel ?? []).find((slide) => slide.image);
      if (photo?.image) {
        await query(
          "INSERT INTO shop_category_carousel (shop_category_id, sort_order, title, image_id) VALUES ($1, $2, $3, $4)",
          [Number(id), 0, "", Number(photo.image.assetId)],
        );
      }
      await clearOverlay("shop-categories", id);
      await releaseLocks("shop-category", id);
      return this.getShopCategory(id);
    },
    async hideShopCategory(id) {
      requirePermission("hide");
      const publishedProducts = await query(
        "SELECT id FROM products WHERE shop_category_id=$1 AND status='published' LIMIT 1",
        [Number(id)],
      );
      if (publishedProducts.length > 0) throw new AdminClientError("category_has_published_products");
      await publishStatus("shop_categories", id, "archived");
      return this.getShopCategory(id);
    },
    async deleteShopCategory(id) {
      requirePermission("delete");
      const children = await query("SELECT id FROM products WHERE shop_category_id = $1 LIMIT 1", [Number(id)]);
      if (children.length > 0) throw new AdminClientError("publish_blocked");
      const row = await requireRow("shop_categories", id);
      if (str(row.status) === "published") throw new AdminClientError("publish_blocked");
      await query("DELETE FROM shop_subcategories WHERE category_id = $1", [Number(id)]);
      await query("DELETE FROM shop_category_carousel WHERE shop_category_id = $1", [Number(id)]);
      await query("DELETE FROM shop_categories WHERE id = $1", [Number(id)]);
    },
    async listShopSubcategories(categoryId) {
      const category = numericId(categoryId);
      if (category == null) throw new AdminClientError("invalid_slug");
      const rows = await query(
        "SELECT id, category_id, name, slug, sort_order FROM shop_subcategories WHERE category_id = $1 ORDER BY sort_order, name, id",
        [category],
      );
      return rows.map((row): ShopSubcategoryDraft => ({
        id: str(row.id), categoryId: str(row.category_id), name: str(row.name), slug: str(row.slug), sortOrder: num(row.sort_order) ?? 0,
      }));
    },
    async createShopSubcategory(input) {
      requirePermission("create_catalog_structure");
      const categoryId = numericId(input.categoryId);
      const name = input.name.trim();
      const slug = input.slug.trim();
      if (categoryId == null || !name || !isValidSlug(slug)) throw new AdminClientError("invalid_slug");
      const category = await query("SELECT id FROM shop_categories WHERE id = $1", [categoryId]);
      if (category.length === 0) throw new AdminClientError("publish_blocked");
      const duplicate = await query(
        "SELECT id FROM shop_subcategories WHERE category_id = $1 AND (lower(name) = lower($2) OR lower(slug) = lower($3)) LIMIT 1",
        [categoryId, name, slug],
      );
      if (duplicate.length > 0) throw new AdminClientError("slug_taken");
      let rows: Row[];
      try {
        rows = await query(
          "INSERT INTO shop_subcategories (category_id, name, slug, sort_order) SELECT $1, $2, $3, COALESCE(MAX(sort_order), -1) + 1 FROM shop_subcategories WHERE category_id = $1 RETURNING id, category_id, name, slug, sort_order",
          [categoryId, name, slug],
        );
      } catch (error) {
        if (isUniqueViolation(error)) throw new AdminClientError("slug_taken");
        throw error;
      }
      const row = rows[0];
      return { id: str(row.id), categoryId: str(row.category_id), name: str(row.name), slug: str(row.slug), sortOrder: num(row.sort_order) ?? 0 };
    },
    async saveShopSubcategory(id, input) {
      requirePermission("create_catalog_structure");
      const subcategoryId = numericId(id);
      const name = input.name.trim();
      const slug = input.slug.trim();
      if (subcategoryId == null || !name || !isValidSlug(slug)) throw new AdminClientError("invalid_slug");
      const current = await requireRow("shop_subcategories", id);
      const duplicate = await query(
        "SELECT id FROM shop_subcategories WHERE category_id = $1 AND id <> $2 AND (lower(name) = lower($3) OR lower(slug) = lower($4)) LIMIT 1",
        [Number(current.category_id), subcategoryId, name, slug],
      );
      if (duplicate.length > 0) throw new AdminClientError("slug_taken");
      let rows: Row[];
      try {
        rows = await query(
          "UPDATE shop_subcategories SET name = $2, slug = $3, updated_at = now() WHERE id = $1 RETURNING id, category_id, name, slug, sort_order",
          [subcategoryId, name, slug],
        );
      } catch (error) {
        if (isUniqueViolation(error)) throw new AdminClientError("slug_taken");
        throw error;
      }
      const row = rows[0];
      return { id: str(row.id), categoryId: str(row.category_id), name: str(row.name), slug: str(row.slug), sortOrder: num(row.sort_order) ?? 0 };
    },
    async deleteShopSubcategory(id) {
      requirePermission("delete");
      const subcategoryId = numericId(id);
      if (subcategoryId == null) throw new AdminClientError("invalid_slug");
      await query("SELECT id FROM shop_subcategories WHERE id = $1 FOR UPDATE", [subcategoryId]);
      const savedProduct = await query("SELECT id FROM products WHERE subcategory_id = $1 LIMIT 1", [subcategoryId]);
      const draftProduct = await query(
        "SELECT doc_id FROM cms_drafts WHERE collection = 'shop-products' AND draft->>'subcategoryId' = $1 LIMIT 1",
        [id],
      );
      if (savedProduct.length > 0 || draftProduct.length > 0) throw new AdminClientError("publish_blocked");
      const deleted = await query("DELETE FROM shop_subcategories WHERE id = $1 RETURNING id", [subcategoryId]);
      if (deleted.length === 0) throw new AdminClientError("not_found");
    },
    async listShopProducts() {
      const rows = await query("SELECT * FROM products ORDER BY name");
      const items = [];
      for (const row of rows) {
        const record = await present("shop-products", str(row.id), await mapProduct(row), str(row.status));
        const category = await query("SELECT name, status FROM shop_categories WHERE id = $1", [Number(record.draft.categoryId)]);
        items.push({
          id: record.id,
          name: record.draft.name,
          categoryId: record.draft.categoryId,
          categoryName: str(category[0]?.name),
          categoryPublished: str(category[0]?.status) === "published",
          isPublished: record.publishedSnapshot != null && !record.hidden,
          subcategoryId: record.draft.subcategoryId,
          status: documentStatus(record),
          hasUnpublishedDraft: record.publishedSnapshot != null && !sameJson(record.draft, record.publishedSnapshot),
          imageAssetId: record.draft.mainImage?.assetId ?? null,
        });
      }
      return items;
    },
    async createShopProduct(input) {
      requirePermission("create_catalog_items");
      const slug = slugifyTitle(input.name);
      if (!isValidSlug(slug)) throw new AdminClientError("invalid_slug");
      const rows = await query(
        "INSERT INTO products (name, slug, shop_category_id, status) VALUES ($1, $2, $3, 'draft') RETURNING *",
        [input.name.trim(), slug, Number(input.categoryId)],
      );
      const record = await present("shop-products", str(rows[0].id), await mapProduct(rows[0]), "draft");
      await rememberMutation({
        entityType: "shop-product",
        entityId: record.id,
        entityTitle: input.name.trim(),
        operation: "create",
        before: null,
        after: record.draft,
      });
      return record;
    },
    async getShopProduct(id) {
      const row = await requireRow("products", id);
      return present("shop-products", id, await mapProduct(row), str(row.status));
    },
    async saveShopProduct(id, draft, expectedSavedDraft?: unknown) {
      requirePermission("edit_catalog");
      if (!isValidSlug(draft.slug)) throw new AdminClientError("invalid_slug");
      if (draft.subcategoryId) {
        const subcategoryId = numericId(draft.subcategoryId);
        if (subcategoryId == null) throw new AdminClientError("publish_blocked");
        const subcategory = await query(
          "SELECT id FROM shop_subcategories WHERE id = $1 AND category_id = $2 FOR KEY SHARE",
          [subcategoryId, Number(draft.categoryId)],
        );
        if (subcategory.length === 0) throw new AdminClientError("publish_blocked");
      }
      const current = await this.getShopProduct(id);
      assertDraftVersion(expectedSavedDraft, current.savedDraft);
      const next = { ...draft, id };
      await writeOverlay("shop-products", id, next);
      await rememberMutation({
        entityType: "shop-product",
        entityId: id,
        entityTitle: entityTitle(next, id),
        operation: current.publishedSnapshot == null ? "create" : "update",
        before: current.savedDraft ?? current.publishedSnapshot,
        after: next,
      });
      return this.getShopProduct(id);
    },
    async publishShopProduct(id) {
      requirePermission("publish");
      const current = await this.getShopProduct(id);
      const draft = assertSaved(current);
      const categories = await query("SELECT id FROM shop_categories WHERE id = $1", [Number(draft.categoryId)]);
      if (shopProductPublishBlockers(draft, categories.length > 0).length > 0) throw new AdminClientError("publish_blocked");
      await applyPendingMediaReplacements(draft);
      if (draft.subcategoryId) {
        const subcategories = await query(
          "SELECT id FROM shop_subcategories WHERE id = $1 AND category_id = $2",
          [Number(draft.subcategoryId), Number(draft.categoryId)],
        );
        if (subcategories.length === 0) throw new AdminClientError("publish_blocked");
      }
      await query(
        "UPDATE products SET name=$2, slug=$3, shop_category_id=$4, subcategory_id=$5, short_description=$6, full_description=$7::jsonb, price=$8, price_on_request=$9, main_image_id=$10, status='published', updated_at=now() WHERE id=$1",
        [
          Number(id),
          draft.name,
          draft.slug,
          Number(draft.categoryId),
          draft.subcategoryId ? Number(draft.subcategoryId) : null,
          draft.descriptionShort,
          JSON.stringify(lexical(draft.descriptionLong)),
          draft.price ?? null,
          draft.priceOnRequest,
          draft.mainImage ? Number(draft.mainImage.assetId) : null,
        ],
      );
      const keptVariantIds = draft.variants.map((variant) => variant.id);
      for (const [index, variant] of draft.variants.entries()) {
        await query(
          `INSERT INTO products_variants (_order, _parent_id, id, sku, color, size, price, price_on_request, available)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
           ON CONFLICT (id) DO UPDATE SET _order=$1, sku=$4, color=$5, size=$6, price=$7, price_on_request=$8, available=$9`,
          [
            index,
            Number(id),
            variant.id,
            variant.sku,
            variant.color,
            variant.size,
            variant.price ?? null,
            variant.priceOnRequest,
            variant.available,
          ],
        );
      }
      if (keptVariantIds.length === 0) {
        await query("DELETE FROM products_variants WHERE _parent_id = $1", [Number(id)]);
      } else {
        await query(
          "DELETE FROM products_variants WHERE _parent_id = $1 AND NOT (id = ANY($2::varchar[]))",
          [Number(id), keptVariantIds],
        );
      }
      await replaceGallery("products_rels", Number(id), draft.gallery ?? []);
      await clearOverlay("shop-products", id);
      await releaseLocks("shop-product", id);
      return this.getShopProduct(id);
    },
    async hideShopProduct(id) {
      requirePermission("hide");
      await publishStatus("products", id, "archived");
      return this.getShopProduct(id);
    },
    async deleteShopProduct(id) {
      requirePermission("delete");
      const row = await requireRow("products", id);
      if (str(row.status) === "published") throw new AdminClientError("publish_blocked");
      await query("DELETE FROM products WHERE id = $1", [Number(id)]);
    },
    async listPages() {
      const rows = await query("SELECT * FROM pages");
      const byKey = new Map(rows.map((row) => [str(row.key), row]));
      const pages = [];
      for (const key of PAGE_KEYS) {
        const row = byKey.get(key);
        if (row == null) continue;
        pages.push(await present("pages", key, await mapPage(row), str(row.status)));
      }
      return pages;
    },
    async getPage(key) {
      const rows = await query("SELECT * FROM pages WHERE key = $1", [key]);
      const row = rows[0];
      if (row == null) throw new AdminClientError("publish_blocked");
      return present("pages", key, await mapPage(row), str(row.status));
    },
    async savePage(key, draft, expectedSavedDraft?: unknown) {
      requirePermission("edit_site_pages");
      const current = await this.getPage(key);
      assertDraftVersion(expectedSavedDraft, current.savedDraft);
      await writeOverlay("pages", key, draft);
      await rememberMutation({
        entityType: "page",
        entityId: key,
        entityTitle: entityTitle(draft, key),
        operation: current.publishedSnapshot == null ? "create" : "update",
        before: current.savedDraft ?? current.publishedSnapshot,
        after: draft,
      });
      return this.getPage(key);
    },
    async publishPage(key) {
      requirePermission("publish");
      const current = await this.getPage(key);
      const draft = assertSaved(current);
      await applyPendingMediaReplacements(draft);
      await writePage(draft);
      await clearOverlay("pages", key);
      await releaseLocks("page", key);
      return this.getPage(key);
    },
    async hidePage(key) {
      requirePermission("hide");
      await query("UPDATE pages SET status='archived', updated_at=now() WHERE key=$1", [key]);
      return this.getPage(key);
    },
    async resetPage(key) {
      requirePermission("publish");
      await query("UPDATE pages SET status = 'draft', updated_at = now() WHERE key = $1", [key]);
      await clearOverlay("pages", key);
      return this.getPage(key);
    },
    async listMaterials() {
      const articles = await query(`SELECT tire_iq_articles.*,
        ARRAY(SELECT taxonomy.value FROM tire_iq_articles_taxonomy taxonomy
          WHERE taxonomy.parent_id = tire_iq_articles.id ORDER BY taxonomy."order") AS taxonomy
        FROM tire_iq_articles ORDER BY title`);
      const items = [];
      for (const row of articles) {
        const record = await present("materials", `article-${row.id}`, await mapArticle(row), str(row.status));
        items.push({
          id: record.id,
          title: record.draft.title,
          kind: record.draft.kind,
          status: documentStatus(record),
          hasUnpublishedDraft: record.publishedSnapshot != null && !sameJson(record.draft, record.publishedSnapshot),
          imageAssetId: record.draft.image?.assetId ?? null,
        });
      }
      return items;
    },
    async getMaterial(id) {
      const match = /^article-(\d+)$/.exec(id);
      if (!match) throw new AdminClientError("not_found");
      const [row] = await query(`SELECT tire_iq_articles.*,
        ARRAY(SELECT taxonomy.value FROM tire_iq_articles_taxonomy taxonomy
          WHERE taxonomy.parent_id = tire_iq_articles.id ORDER BY taxonomy."order") AS taxonomy
        FROM tire_iq_articles WHERE id = $1`, [Number(match[1])]);
      if (!row) throw new AdminClientError("not_found");
      return present("materials", id, await mapArticle(row), str(row.status));
    },
    async createMaterial(input) {
      requirePermission("edit_site_pages");
      const slug = slugifyTitle(input.title);
      if (!isValidSlug(slug)) throw new AdminClientError("invalid_slug");
      const rows = await query("INSERT INTO tire_iq_articles (title, slug, content, status) VALUES ($1, $2, $3::jsonb, 'draft') RETURNING *", [
        input.title.trim(),
        slug,
        JSON.stringify(lexical("")),
      ]);
      const id = `article-${rows[0].id}`;
      const record = await present("materials", id, await mapArticle(rows[0]), "draft");
      await rememberMutation({
        entityType: "material",
        entityId: record.id,
        entityTitle: input.title.trim(),
        operation: "create",
        before: null,
        after: record.draft,
      });
      return record;
    },
    async saveMaterial(id, draft, expectedSavedDraft?: unknown) {
      requirePermission("edit_site_pages");
      if (!isValidSlug(draft.slug)) throw new AdminClientError("invalid_slug");
      const current = await this.getMaterial(id);
      assertDraftVersion(expectedSavedDraft, current.savedDraft);
      const next = { ...draft, id };
      await writeOverlay("materials", id, next);
      await rememberMutation({
        entityType: "material",
        entityId: id,
        entityTitle: entityTitle(next, id),
        operation: current.publishedSnapshot == null ? "create" : "update",
        before: current.savedDraft ?? current.publishedSnapshot,
        after: next,
      });
      return this.getMaterial(id);
    },
    async publishMaterial(id) {
      requirePermission("publish");
      const current = await this.getMaterial(id);
      const draft = assertSaved(current);
      if (articlePublishBlockers(draft).length > 0) throw new AdminClientError("publish_blocked");
      await applyPendingMediaReplacements(draft);
      const rawId = id.slice("article-".length);
      await query(
        "UPDATE tire_iq_articles SET title=$2, slug=$3, excerpt=$4, content=$5::jsonb, featured_image_id=$6, show_in_menu=$7, menu_order=$8, status='published', updated_at=now() WHERE id=$1",
        [Number(rawId), draft.title, draft.slug, draft.excerpt, JSON.stringify(lexical(draft.body)), draft.image ? Number(draft.image.assetId) : null, draft.showInMenu, draft.menuOrder],
      );
      const allowedTaxonomy = new Set(["selection", "wear", "pressure", "load", "axles", "quarry", "construction", "tco", "diagnostics"]);
      const taxonomy = [...new Set(Array.isArray(draft.taxonomy) ? draft.taxonomy : [])]
        .filter((value): value is string => typeof value === "string" && allowedTaxonomy.has(value));
      await query('DELETE FROM tire_iq_articles_taxonomy WHERE parent_id = $1', [Number(rawId)]);
      for (const [index, value] of taxonomy.entries()) {
        await query('INSERT INTO tire_iq_articles_taxonomy (parent_id, "order", value) VALUES ($1, $2, $3)', [Number(rawId), index, value]);
      }
      await clearOverlay("materials", id);
      await releaseLocks("material", id);
      return this.getMaterial(id);
    },
    async hideMaterial(id) {
      requirePermission("hide");
      const current = await this.getMaterial(id);
      await publishStatus("tire_iq_articles", id.slice("article-".length), "archived");
      return this.getMaterial(id);
    },
    async unpublishDocument(entityType, entityId) {
      requirePermission("publish");
      if (entityType === "page") {
        await query("UPDATE pages SET status='draft', updated_at=now() WHERE key=$1", [entityId]);
        return null;
      }

      const tableByEntity: Record<Exclude<StatusEntity, "page">, string> = {
        "tire-direction": "tire_types",
        "tire-model": "tire_models",
        "wheel-type": "wheel_types",
        "wheel-model": "wheel_models",
        "shop-category": "shop_categories",
        "shop-product": "products",
        material: "tire_iq_articles",
      };
      if (entityType === "shop-category") {
        const publishedProducts = await query(
          "SELECT id FROM products WHERE shop_category_id=$1 AND status='published' LIMIT 1",
          [Number(entityId)],
        );
        if (publishedProducts.length > 0) throw new AdminClientError("category_has_published_products");
      }
      const id = entityType === "material" ? entityId.replace(/^article-/, "") : entityId;
      await publishStatus(tableByEntity[entityType as Exclude<StatusEntity, "page">], id, "draft");
      return null;
    },
    async deleteMaterial(id) {
      requirePermission("delete");
      const current = await this.getMaterial(id);
      if (current.publishedSnapshot != null) throw new AdminClientError("publish_blocked");
      await query("DELETE FROM tire_iq_articles WHERE id = $1", [Number(id.slice("article-".length))]);
    },
    async listUsers() {
      requirePermission("manage_users");
      const rows = await query("SELECT id, email, name, role, status, cms_capabilities FROM users ORDER BY email");
      return rows.map(
        (row): AdminUser => ({
          id: str(row.id),
          login: str(row.email || row.name),
          role: str(row.role) === "admin" ? "admin" : "editor",
          disabled: str(row.status) !== "active",
          capabilities: parseCapabilities(row.cms_capabilities),
        }),
      );
    },
    async createUser(input) {
      requirePermission("manage_users");
      const capabilities = input.role === "admin" ? [] : parseCapabilities(input.capabilities ?? []);
      const rows = await query(
        `INSERT INTO users (name, email, role, status, hash, cms_capabilities, created_at, updated_at)
         VALUES ($1, $1, $2, 'active', $3, $4::jsonb, now(), now())
         RETURNING id, email, role, status, cms_capabilities`,
        [input.login, storedRole(input.role), hashPassword(input.password), JSON.stringify(capabilities)],
      );
      return {
        id: str(rows[0].id),
        login: str(rows[0].email),
        role: input.role,
        disabled: false,
        capabilities,
      };
    },
    async disableUser(id) {
      requirePermission("manage_users");
      const users = await this.listUsers();
      const user = users.find((item) => item.id === id);
      if (user == null) throw new AdminClientError("publish_blocked");
      if (user.login === session.login) throw new AdminClientError("cannot_disable_self");
      const admins = users.filter((item) => item.role === "admin" && !item.disabled);
      if (user.role === "admin" && admins.length <= 1) throw new AdminClientError("last_admin");
      await query("UPDATE users SET status = 'inactive', updated_at = now() WHERE id = $1", [Number(id)]);
      return { ...user, disabled: true };
    },
    async setUserRole(id, role) {
      requirePermission("manage_users");
      const users = await this.listUsers();
      const user = users.find((item) => item.id === id);
      if (user == null) throw new AdminClientError("publish_blocked");
      const admins = users.filter((item) => item.role === "admin" && !item.disabled);
      if (user.role === "admin" && role !== "admin" && admins.length <= 1) throw new AdminClientError("last_admin");
      const capabilities = role === "admin" ? [] : user.capabilities;
      await query("UPDATE users SET role = $2, cms_capabilities = $3::jsonb, updated_at = now() WHERE id = $1", [
        Number(id),
        storedRole(role),
        JSON.stringify(capabilities),
      ]);
      return { ...user, role, capabilities };
    },
    async setUserCapabilities(userId, capabilities) {
      requirePermission("manage_users");
      const users = await this.listUsers();
      const user = users.find((item) => item.id === userId);
      if (user == null) throw new AdminClientError("publish_blocked");
      const next = user.role === "admin" ? [] : parseCapabilities(capabilities);
      await query("UPDATE users SET cms_capabilities = $2::jsonb, updated_at = now() WHERE id = $1", [
        Number(userId),
        JSON.stringify(next),
      ]);
      return { ...user, capabilities: next };
    },
    async resetUserPassword(userId, password) {
      requirePermission("manage_users");
      await resetAccountPassword(query, { id: actor.id, login: actor.login }, userId, password);
    },
    async listPasswordResetHistory(): Promise<PasswordResetHistoryItem[]> {
      requirePermission("manage_users");
      const rows = await query(
        `SELECT id, target_login, actor_login, created_at
         FROM cms_password_reset_history ORDER BY created_at DESC, id DESC LIMIT 100`,
      );
      return rows.map((row) => ({
        id: str(row.id),
        targetLogin: str(row.target_login),
        resetBy: str(row.actor_login),
        resetAt: new Date(str(row.created_at)).toISOString(),
      }));
    },
    async listChangeSets(filter) {
      const packs = await loadPacks();
      let visible = packs;
      if (session.role !== "admin") {
        visible = packs.filter((pack) => pack.authorUserId === actor.id);
      } else {
        requirePermission("review_queue");
      }
      if (filter?.status) visible = visible.filter((pack) => pack.status === filter.status);
      if (filter?.authorUserId) visible = visible.filter((pack) => pack.authorUserId === filter.authorUserId);
      return visible.slice().sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
    },
    async getChangeSet(id) {
      const pack = await requirePack(id);
      if (session.role !== "admin" && pack.authorUserId !== actor.id) throw new AdminClientError("forbidden");
      return pack;
    },
    async submitChangeSet(id) {
      await lockChangeSets();
      const pack = await requirePack(id);
      assertCanSubmitChangeSet(pack, actor.id);
      const next = {
        ...pack,
        status: "pending_review" as const,
        submittedAt: new Date().toISOString(),
        reviewComment: null,
      };
      await upsertPack(next);
      return next;
    },
    async publishChangeSet(id) {
      requirePermission("review_queue");
      await lockChangeSets();
      const rows = await query("SELECT pack FROM cms_change_sets WHERE id = $1 FOR UPDATE", [id]);
      const pack = rows[0]?.pack as ChangeSet | undefined;
      if (pack == null) throw new AdminClientError("publish_blocked");
      assertCanPublishChangeSet(pack);
      const published = {
        ...pack,
        status: "published" as const,
        reviewedAt: new Date().toISOString(),
        reviewedByLogin: session.login,
      };
      await publishPackAtomically(
        getPool(),
        pack.entries,
        (entry) => publishEntry(this, entry.entityType, entry.entityId),
        () => upsertPack(published),
      );
      return published;
    },
    async returnChangeSet(id, comment) {
      requirePermission("review_queue");
      await lockChangeSets();
      const pack = await requirePack(id);
      assertCanReturnChangeSet(pack, comment);
      const next = {
        ...pack,
        status: "returned" as const,
        reviewComment: comment.trim(),
        reviewedAt: new Date().toISOString(),
        reviewedByLogin: session.login,
      };
      await upsertPack(next);
      return next;
    },
    async cancelChangeSet(id) {
      requirePermission("review_queue");
      await lockChangeSets();
      const pack = await requirePack(id);
      assertCanCancelChangeSet(pack);
      for (const entry of pack.entries) {
        await restoreEntry(this, entry);
      }
      const next = {
        ...pack,
        status: "cancelled" as const,
        reviewedAt: new Date().toISOString(),
        reviewedByLogin: session.login,
      };
      await upsertPack(next);
      return next;
    },
  };

  return new Proxy(adminClient, {
    get(target, property, receiver) {
      const value = Reflect.get(target, property, receiver) as unknown;
      if (
        typeof property !== "string" ||
        typeof value !== "function" ||
        property === "createAsset" ||
        property === "replaceAsset" ||
        !/^(create|save|publish|unpublish|hide|delete|reset|submit|return|cancel|update|assign|set)/.test(property)
      ) {
        return value;
      }
      return (...args: unknown[]) => withTransaction(getPool(), () => value.apply(receiver, args));
    },
  });
}

async function writePage(draft: PageDraft) {
  if (draft.id === "home") {
    await query(
      `UPDATE pages SET title=$1, seo_seo_title=$2, seo_seo_description=$3,
        home_hero_eyebrow=$4, home_hero_title=$5, home_hero_lead=$6,
        home_hero_primary_cta_label=$7, home_hero_primary_cta_href=$8,
        home_hero_secondary_cta_label=$9, home_hero_secondary_cta_href=$10,
        home_hero_metric_label=$11, home_hero_metric_text=$12,
        home_hero_image_id=$13, home_hero_image_alt=$14,
        home_selection_entry_eyebrow=$15, home_selection_entry_title=$16, home_selection_entry_lead=$17,
        home_selection_entry_image_id=$18, home_selection_entry_image_alt=$19,
        home_shop_campaign_eyebrow=$20, home_shop_campaign_title=$21, home_shop_campaign_lead=$22,
        home_shop_campaign_image_id=$23, home_shop_campaign_image_alt=$24,
        home_shop_campaign_cta_label=$25, home_shop_campaign_cta_href=$26,
        home_directions_eyebrow=$27, home_directions_title=$28, home_directions_lead=$29,
        home_expertise_eyebrow=$30, home_expertise_title=$31, home_expertise_lead=$32,
        status='published', updated_at=now()
       WHERE key='home'`,
      [
        draft.hero.title || "Главная Bizon",
        draft.seoTitle,
        draft.seoDescription,
        draft.hero.eyebrow,
        draft.hero.title,
        draft.hero.lead,
        draft.hero.primaryCta.label,
        draft.hero.primaryCta.href,
        draft.hero.secondaryCta.label,
        draft.hero.secondaryCta.href,
        draft.hero.metricLabel,
        draft.hero.metricText,
        draft.hero.image ? Number(draft.hero.image.assetId) : null,
        draft.hero.image?.alt || null,
        draft.selectionEntry.eyebrow,
        draft.selectionEntry.title,
        draft.selectionEntry.lead,
        draft.selectionEntry.image ? Number(draft.selectionEntry.image.assetId) : null,
        draft.selectionEntry.image?.alt || null,
        draft.shopCampaign.eyebrow,
        draft.shopCampaign.title,
        draft.shopCampaign.lead,
        draft.shopCampaign.image ? Number(draft.shopCampaign.image.assetId) : null,
        draft.shopCampaign.image?.alt || null,
        draft.shopCampaign.cta.label,
        draft.shopCampaign.cta.href,
        draft.directions.eyebrow,
        draft.directions.title,
        draft.directions.lead,
        draft.expertise.eyebrow,
        draft.expertise.title,
        draft.expertise.lead,
      ],
    );
    return;
  }
  if (draft.id === "shop-home") {
    const [page] = await query(`SELECT id FROM pages WHERE key='shop-home'`);
    if (page == null) return;
    const parentId = Number(page.id);
    await query(
      `UPDATE pages SET seo_seo_title=$1, seo_seo_description=$2, shop_hero_eyebrow=$3, shop_hero_title=$4, shop_hero_lead=$5, shop_hero_cta_label=$6, shop_hero_cta_href=$7, shop_hero_image_id=$8, shop_hero_image_alt=$9, shop_wheels_intro_eyebrow=$10, shop_wheels_intro_title=$11, shop_wheels_intro_lead=$12, shop_wheels_intro_kicker=$13, shop_vehicles_eyebrow=$14, shop_vehicles_title=$15, shop_vehicles_lead=$16, shop_vehicles_cta_label=$17, shop_vehicles_cta_href=$18, shop_catalog_eyebrow=$19, shop_catalog_title=$20, shop_catalog_lead=$21, shop_catalog_section_title=$22, status='published', updated_at=now() WHERE key='shop-home'`,
      shopHomeParentValues(draft),
    );
    const children = shopHomeChildRows(parentId, draft);
    await query(`DELETE FROM pages_shop_order_steps WHERE _parent_id=$1`, [parentId]);
    for (const step of children.steps) {
      await query(
        `INSERT INTO pages_shop_order_steps (id, _parent_id, _order, title, description) VALUES ($1, $2, $3, $4, $5)`,
        [step.id, step.parentId, step.order, step.title, step.description],
      );
    }
    await query(`DELETE FROM pages_shop_category_carousel WHERE _parent_id=$1`, [parentId]);
    for (const slide of children.carousel) {
      await query(
        `INSERT INTO pages_shop_category_carousel (id, slide_id, _parent_id, _order, kicker, title, action, href, alt, desktop_image_id, mobile_image_id) VALUES ($1, $1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [
          slide.id,
          slide.parentId,
          slide.order,
          slide.kicker,
          slide.title,
          slide.action,
          slide.href,
          slide.alt,
          slide.desktopImageId,
          slide.mobileImageId,
        ],
      );
    }
    await query(`DELETE FROM pages_shop_catalog_tiles WHERE _parent_id=$1`, [parentId]);
    for (const tile of children.catalogTiles) {
      await query(
        `INSERT INTO pages_shop_catalog_tiles (_parent_id, category_id, _order, title, visible, icon_media_id, image_media_id, carousel_image_media_id, carousel_visible, icon_alt, image_alt, carousel_image_alt) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
        [tile.parentId, tile.categoryId, tile.order, tile.title, tile.visible, tile.iconId, tile.imageId, tile.carouselImageId, tile.carouselVisible, tile.iconAlt, tile.imageAlt, tile.carouselImageAlt],
      );
    }
    await query(`DELETE FROM pages_shop_vehicles_slides WHERE _parent_id=$1`, [parentId]);
    for (const slide of children.vehicles) {
      await query(
        `INSERT INTO pages_shop_vehicles_slides (id, _parent_id, _order, title, alt, image_id) VALUES ($1, $2, $3, $4, $5, $6)`,
        [slide.id, slide.parentId, slide.order, slide.title, slide.alt, slide.imageId],
      );
    }
    return;
  }
  await query(
    `UPDATE pages SET seo_seo_title=$2, seo_seo_description=$3, stub_hero_eyebrow=$4, stub_hero_title=$5, stub_hero_lead=$6, stub_hero_image_id=$7, stub_hero_image_alt=$8, status='published', updated_at=now() WHERE key=$1`,
    [
      draft.id,
      draft.seoTitle,
      draft.seoDescription,
      draft.hero.eyebrow,
      draft.hero.title,
      draft.hero.lead,
      draft.hero.image ? Number(draft.hero.image.assetId) : null,
      draft.hero.image?.alt || null,
    ],
  );
}

export async function catalogPublishGaps(account: AuthenticatedAccount): Promise<string[]> {
  const client = createPostgresAdminClient(account);
  const gaps: string[] = [];
  for (const item of await client.listTireModels()) {
    const record = await client.getTireModel(item.id);
    const blockers = tireModelPublishBlockers(record.draft, true);
    if (blockers.length > 0) gaps.push(`tire ${record.draft.name}: ${blockers.join(",")}`);
  }
  for (const item of await client.listWheelModels()) {
    const record = await client.getWheelModel(item.id);
    const blockers = wheelModelPublishBlockers(record.draft, true);
    if (blockers.length > 0) gaps.push(`wheel ${record.draft.name}: ${blockers.join(",")}`);
  }
  for (const item of await client.listTireDirections()) {
    const record = await client.getTireDirection(item.id);
    const blockers = tireDirectionPublishBlockers(record.draft);
    if (blockers.length > 0) gaps.push(`direction ${record.draft.name}: ${blockers.join(",")}`);
  }
  for (const item of await client.listWheelTypes()) {
    const blockers = wheelTypePublishBlockers(item.draft);
    if (blockers.length > 0) gaps.push(`wheel type ${item.draft.name}: ${blockers.join(",")}`);
  }
  for (const item of await client.listMaterials()) {
    const record = await client.getMaterial(item.id);
    const blockers = articlePublishBlockers(record.draft);
    if (blockers.length > 0) gaps.push(`material ${record.draft.title}: ${blockers.join(",")}`);
  }
  return gaps;
}
