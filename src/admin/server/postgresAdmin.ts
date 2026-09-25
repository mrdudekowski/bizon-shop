import { Pool, type PoolClient } from "pg";

import { AdminClientError } from "@/admin/client/errors";
import type { AdminClient } from "@/admin/client/adminClient";
import {
  articlePublishBlockers,
  shopProductPublishBlockers,
  tireDirectionPublishBlockers,
  tireModelPublishBlockers,
  wheelModelPublishBlockers,
  wheelTypePublishBlockers,
} from "@/admin/domain/publishRules";
import { isValidSlug, slugifyTitle } from "@/admin/domain/slug";
import type { CatalogAxle } from "@/admin/domain/options";
import type {
  AdminSession,
  AdminUser,
  ArticleDraft,
  DocumentLink,
  EntityRecord,
  ImagePlacement,
  PageDraft,
  PageKey,
  ShopCategoryDraft,
  ShopProductDraft,
  ShopVariantDraft,
  TireDirection,
  TireDirectionDraft,
  TireModelDraft,
  TireModelListItem,
  TireModelRecord,
  TireSizeDraft,
  WheelModelDraft,
  WheelTypeDraft,
  WheelVariantDraft,
} from "@/admin/domain/types";
import { PAGE_KEYS } from "@/admin/domain/types";

const pool = new Pool({
  connectionString: process.env.DATABASE_URI ?? "postgresql://postgres:postgres@127.0.0.1:5433/bizon",
});

let session: AdminSession = { login: "admin", role: "admin" };
let draftsReady: Promise<void> | null = null;

type Row = Record<string, unknown>;

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
  const result = await (client ?? pool).query(text, params);
  return result.rows as Row[];
}

function ensureDrafts(): Promise<void> {
  draftsReady ??= pool
    .query(`CREATE TABLE IF NOT EXISTS cms_drafts (
      collection text NOT NULL,
      doc_id text NOT NULL,
      draft jsonb NOT NULL,
      PRIMARY KEY (collection, doc_id)
    )`)
    .then(() => undefined);
  return draftsReady;
}

async function readOverlay<T>(collection: string, id: string): Promise<T | null> {
  await ensureDrafts();
  const rows = await query("SELECT draft FROM cms_drafts WHERE collection = $1 AND doc_id = $2", [collection, id]);
  return (rows[0]?.draft as T | undefined) ?? null;
}

async function writeOverlay(collection: string, id: string, draft: unknown): Promise<void> {
  await ensureDrafts();
  await query(
    `INSERT INTO cms_drafts (collection, doc_id, draft) VALUES ($1, $2, $3::jsonb)
     ON CONFLICT (collection, doc_id) DO UPDATE SET draft = EXCLUDED.draft`,
    [collection, id, JSON.stringify(draft)],
  );
}

async function clearOverlay(collection: string, id: string): Promise<void> {
  await ensureDrafts();
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
  const draft = overlay ?? mapped;
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
  const [sizes, features, positions, applications, vehicles, conditions, axles] = await Promise.all([
    query("SELECT * FROM tire_variants WHERE tire_model_id = $1 ORDER BY sort_order, id", [id]),
    query("SELECT * FROM tire_models_features WHERE _parent_id = $1 ORDER BY _order, id", [id]),
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
    gallery: [],
    advantages: [],
    documents: [] as DocumentLink[],
    sizes: sizes.map(mapSize),
    brand: "",
    descriptionShort: str(row.short_description),
    descriptionLong: plainText(row.full_description),
    applicationCategory: (str(row.application_category) || "") as TireModelDraft["applicationCategory"],
    treadType: str(row.tread_type),
    modelCode: str(row.model_code),
    features: features.map((feature) => ({
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
  const variants = await query("SELECT * FROM products_variants WHERE _parent_id = $1 ORDER BY _order, id", [row.id]);
  return {
    id: str(row.id),
    name: str(row.name),
    slug: str(row.slug),
    categoryId: str(row.shop_category_id),
    descriptionShort: str(row.short_description),
    descriptionLong: plainText(row.full_description),
    price: num(row.price),
    priceOnRequest: Boolean(row.price_on_request),
    mainImage: placement(row.main_image_id),
    gallery: [],
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

function mapCategory(row: Row): ShopCategoryDraft {
  return {
    id: str(row.id),
    name: str(row.name),
    slug: str(row.slug),
    description: str(row.description),
    mainImage: placement(row.cover_image_id),
    sortOrder: num(row.sort_order) ?? 0,
    showInMenu: Boolean(row.show_in_menu),
  };
}

async function mapArticle(row: Row, kind: ArticleDraft["kind"]): Promise<ArticleDraft> {
  const taxonomy =
    kind === "article"
      ? await valuesOf("tire_iq_articles_taxonomy", "parent_id", Number(row.id))
      : [];
  return {
    id: `${kind}-${row.id}`,
    kind,
    title: str(row.title),
    slug: str(row.slug),
    excerpt: str(row.excerpt),
    body: plainText(row.content),
    image: placement(row.featured_image_id),
    gallery: [],
    showInMenu: Boolean(row.show_in_menu),
    menuOrder: num(row.menu_order) ?? 0,
    clientName: str(row.client_name),
    industry: taxonomy.join(", ") || str(row.industry),
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
      selectionEntry: section(row.home_selection_entry_eyebrow, row.home_selection_entry_title, row.home_selection_entry_lead),
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
    const [steps, carousel, vehicles] = await Promise.all([
      query("SELECT * FROM pages_shop_order_steps WHERE _parent_id = $1 ORDER BY _order", [row.id]),
      query("SELECT * FROM pages_shop_category_carousel WHERE _parent_id = $1 ORDER BY _order", [row.id]),
      query("SELECT * FROM pages_shop_vehicles_slides WHERE _parent_id = $1 ORDER BY _order", [row.id]),
    ]);
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
  for (const feature of draft.features ?? []) {
    await client.query("UPDATE tire_models_features SET title=$2, description=$3 WHERE id=$1", [
      feature.id,
      feature.title,
      feature.description,
    ]);
  }
  await replaceValues(client, "tire_models_positions", "parent_id", id, draft.selectionAxles);
  await replaceValues(client, "tire_models_application_types", "parent_id", id, draft.applicationTypes ?? []);
}

async function publishStatus(table: string, id: string, status: "published" | "archived" | "draft") {
  await query(`UPDATE ${table} SET status=$2, updated_at=now() WHERE id=$1`, [Number(id), status]);
}

export function createPostgresAdminClient(): AdminClient {
  return {
    async getSession() {
      return session;
    },
    async setSessionRole(role) {
      session = { ...session, role };
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
      const slug = slugifyTitle(input.name);
      if (!isValidSlug(slug)) throw new AdminClientError("invalid_slug");
      const rows = await query(
        "INSERT INTO tire_types (name, slug, status) VALUES ($1, $2, 'draft') RETURNING *",
        [input.name.trim(), slug],
      );
      return present("tire-directions", str(rows[0].id), await mapDirection(rows[0]), "draft");
    },
    async getTireDirection(id) {
      const row = await requireRow("tire_types", id);
      return present("tire-directions", id, await mapDirection(row), str(row.status));
    },
    async saveTireDirection(id, draft) {
      if (!isValidSlug(draft.slug)) throw new AdminClientError("invalid_slug");
      await writeOverlay("tire-directions", id, { ...draft, id });
      return this.getTireDirection(id);
    },
    async publishTireDirection(id) {
      const current = await this.getTireDirection(id);
      const draft = assertSaved(current);
      if (tireDirectionPublishBlockers(draft).length > 0) throw new AdminClientError("publish_blocked");
      const client = await pool.connect();
      try {
        await client.query("BEGIN");
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
        await client.query("COMMIT");
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      } finally {
        client.release();
      }
      await clearOverlay("tire-directions", id);
      return this.getTireDirection(id);
    },
    async hideTireDirection(id) {
      await publishStatus("tire_types", id, "archived");
      return this.getTireDirection(id);
    },
    async deleteTireDirection(id) {
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
      const slug = slugifyTitle(input.name);
      if (!isValidSlug(slug)) throw new AdminClientError("invalid_slug");
      const rows = await query(
        "INSERT INTO tire_models (name, slug, tire_type_id, status) VALUES ($1, $2, $3, 'draft') RETURNING *",
        [input.name.trim(), slug, Number(input.directionId)],
      );
      return present("tire-models", str(rows[0].id), await mapTireModel(rows[0]), "draft") as Promise<TireModelRecord>;
    },
    async saveTireModel(id, draft) {
      const current = await requireRow("tire_models", id);
      if (str(current.status) === "published" && draft.slug !== str(current.slug)) throw new AdminClientError("invalid_slug");
      if (!isValidSlug(draft.slug)) throw new AdminClientError("invalid_slug");
      await writeOverlay("tire-models", id, { ...draft, id });
      return this.getTireModel(id);
    },
    async publishTireModel(id) {
      const current = await this.getTireModel(id);
      const draft = assertSaved(current);
      const directions = await query("SELECT id FROM tire_types WHERE id = $1", [Number(draft.directionId)]);
      if (tireModelPublishBlockers(draft, directions.length > 0).length > 0) throw new AdminClientError("publish_blocked");
      const client = await pool.connect();
      try {
        await client.query("BEGIN");
        await writeTireModel(client, draft, "published");
        await client.query("COMMIT");
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      } finally {
        client.release();
      }
      await clearOverlay("tire-models", id);
      return this.getTireModel(id);
    },
    async hideTireModel(id) {
      await publishStatus("tire_models", id, "archived");
      return this.getTireModel(id);
    },
    async deleteTireModel(id) {
      const row = await requireRow("tire_models", id);
      if (str(row.status) === "published") throw new AdminClientError("publish_blocked");
      await query("DELETE FROM tire_models WHERE id = $1", [Number(id)]);
    },
    async createAsset(file) {
      const rows = await query(
        "INSERT INTO media (title, alt, filename, mime_type, url) VALUES ($1, '', $1, $2, $3) RETURNING id",
        [file.name, file.mimeType, file.dataUrl.slice(0, 500)],
      );
      return { id: str(rows[0].id) };
    },
    async listAssets() {
      const rows = await query("SELECT id, title, filename, mime_type, url FROM media ORDER BY id");
      return rows.map((row) => ({
        id: str(row.id),
        name: str(row.filename || row.title),
        mimeType: str(row.mime_type),
        dataUrl: str(row.url),
        usedBy: [],
      }));
    },
    async deleteAsset(id) {
      const used = await query(
        "SELECT id FROM tire_models WHERE main_image_id = $1 UNION ALL SELECT id FROM wheel_models WHERE main_image_id = $1 LIMIT 1",
        [Number(id)],
      );
      if (used.length > 0) throw new AdminClientError("media_in_use");
      await query("DELETE FROM media WHERE id = $1", [Number(id)]);
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
      const slug = slugifyTitle(input.name);
      if (!isValidSlug(slug)) throw new AdminClientError("invalid_slug");
      const rows = await query("INSERT INTO wheel_types (name, slug, status) VALUES ($1, $2, 'draft') RETURNING *", [
        input.name.trim(),
        slug,
      ]);
      return present("wheel-types", str(rows[0].id), mapWheelType(rows[0]), "draft");
    },
    async saveWheelType(id, draft) {
      if (!isValidSlug(draft.slug)) throw new AdminClientError("invalid_slug");
      await writeOverlay("wheel-types", id, { ...draft, id });
      return this.getWheelType(id);
    },
    async publishWheelType(id) {
      const current = await this.getWheelType(id);
      const draft = assertSaved(current);
      if (wheelTypePublishBlockers(draft).length > 0) throw new AdminClientError("publish_blocked");
      await query(
        "UPDATE wheel_types SET name=$2, slug=$3, description=$4, sort_order=$5, cover_image_id=$6, status='published', updated_at=now() WHERE id=$1",
        [Number(id), draft.name, draft.slug, draft.description, draft.sortOrder, draft.mainImage ? Number(draft.mainImage.assetId) : null],
      );
      await clearOverlay("wheel-types", id);
      return this.getWheelType(id);
    },
    async hideWheelType(id) {
      await publishStatus("wheel_types", id, "archived");
      return this.getWheelType(id);
    },
    async deleteWheelType(id) {
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
        });
      }
      return items;
    },
    async createWheelModel(input) {
      const slug = slugifyTitle(input.name);
      if (!isValidSlug(slug)) throw new AdminClientError("invalid_slug");
      const rows = await query(
        "INSERT INTO wheel_models (name, slug, wheel_type_id, status) VALUES ($1, $2, $3, 'draft') RETURNING *",
        [input.name.trim(), slug, Number(input.wheelTypeId)],
      );
      return present("wheel-models", str(rows[0].id), await mapWheelModel(rows[0]), "draft");
    },
    async getWheelModel(id) {
      const row = await requireRow("wheel_models", id);
      return present("wheel-models", id, await mapWheelModel(row), str(row.status));
    },
    async saveWheelModel(id, draft) {
      if (!isValidSlug(draft.slug)) throw new AdminClientError("invalid_slug");
      await writeOverlay("wheel-models", id, { ...draft, id });
      return this.getWheelModel(id);
    },
    async publishWheelModel(id) {
      const current = await this.getWheelModel(id);
      const draft = assertSaved(current);
      const types = await query("SELECT id FROM wheel_types WHERE id = $1", [Number(draft.wheelTypeId)]);
      if (wheelModelPublishBlockers(draft, types.length > 0).length > 0) throw new AdminClientError("publish_blocked");
      const client = await pool.connect();
      try {
        await client.query("BEGIN");
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
        for (const variant of draft.variants) {
          const variantId = numericId(variant.id);
          if (variantId == null) continue;
          await client.query(
            "UPDATE wheel_variants SET size_label=$2, pcd=$3, offset_e_t=$4, center_bore=$5, color=$6, price=$7, price_on_request=$8, available=$9, status='published', updated_at=now() WHERE id=$1",
            [variantId, variant.sizeLabel, variant.pcd, variant.offsetET ?? null, variant.centerBore ?? null, variant.color, variant.price ?? null, variant.priceOnRequest, variant.available],
          );
        }
        await client.query("COMMIT");
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      } finally {
        client.release();
      }
      await clearOverlay("wheel-models", id);
      return this.getWheelModel(id);
    },
    async hideWheelModel(id) {
      await publishStatus("wheel_models", id, "archived");
      return this.getWheelModel(id);
    },
    async deleteWheelModel(id) {
      const row = await requireRow("wheel_models", id);
      if (str(row.status) === "published") throw new AdminClientError("publish_blocked");
      await query("DELETE FROM wheel_models WHERE id = $1", [Number(id)]);
    },
    async listShopCategories() {
      const rows = await query("SELECT * FROM shop_categories ORDER BY sort_order, name");
      const records = [];
      for (const row of rows) records.push(await present("shop-categories", str(row.id), mapCategory(row), str(row.status)));
      return records;
    },
    async getShopCategory(id) {
      const row = await requireRow("shop_categories", id);
      return present("shop-categories", id, mapCategory(row), str(row.status));
    },
    async createShopCategory(input) {
      const slug = slugifyTitle(input.name);
      if (!isValidSlug(slug)) throw new AdminClientError("invalid_slug");
      const rows = await query("INSERT INTO shop_categories (name, slug, status) VALUES ($1, $2, 'draft') RETURNING *", [
        input.name.trim(),
        slug,
      ]);
      return present("shop-categories", str(rows[0].id), mapCategory(rows[0]), "draft");
    },
    async saveShopCategory(id, draft) {
      if (!isValidSlug(draft.slug)) throw new AdminClientError("invalid_slug");
      await writeOverlay("shop-categories", id, { ...draft, id });
      return this.getShopCategory(id);
    },
    async publishShopCategory(id) {
      const current = await this.getShopCategory(id);
      const draft = assertSaved(current);
      if (wheelTypePublishBlockers(draft).length > 0) throw new AdminClientError("publish_blocked");
      await query(
        "UPDATE shop_categories SET name=$2, slug=$3, description=$4, sort_order=$5, show_in_menu=$6, cover_image_id=$7, status='published', updated_at=now() WHERE id=$1",
        [Number(id), draft.name, draft.slug, draft.description, draft.sortOrder, draft.showInMenu, draft.mainImage ? Number(draft.mainImage.assetId) : null],
      );
      await clearOverlay("shop-categories", id);
      return this.getShopCategory(id);
    },
    async hideShopCategory(id) {
      await publishStatus("shop_categories", id, "archived");
      return this.getShopCategory(id);
    },
    async deleteShopCategory(id) {
      const children = await query("SELECT id FROM products WHERE shop_category_id = $1 LIMIT 1", [Number(id)]);
      if (children.length > 0) throw new AdminClientError("publish_blocked");
      const row = await requireRow("shop_categories", id);
      if (str(row.status) === "published") throw new AdminClientError("publish_blocked");
      await query("DELETE FROM shop_categories WHERE id = $1", [Number(id)]);
    },
    async listShopProducts() {
      const rows = await query("SELECT * FROM products ORDER BY name");
      const items = [];
      for (const row of rows) {
        const record = await present("shop-products", str(row.id), await mapProduct(row), str(row.status));
        const category = await query("SELECT name FROM shop_categories WHERE id = $1", [Number(record.draft.categoryId)]);
        items.push({
          id: record.id,
          name: record.draft.name,
          categoryId: record.draft.categoryId,
          categoryName: str(category[0]?.name),
          status: documentStatus(record),
          hasUnpublishedDraft: record.publishedSnapshot != null && !sameJson(record.draft, record.publishedSnapshot),
        });
      }
      return items;
    },
    async createShopProduct(input) {
      const slug = slugifyTitle(input.name);
      if (!isValidSlug(slug)) throw new AdminClientError("invalid_slug");
      const rows = await query(
        "INSERT INTO products (name, slug, shop_category_id, status) VALUES ($1, $2, $3, 'draft') RETURNING *",
        [input.name.trim(), slug, Number(input.categoryId)],
      );
      return present("shop-products", str(rows[0].id), await mapProduct(rows[0]), "draft");
    },
    async getShopProduct(id) {
      const row = await requireRow("products", id);
      return present("shop-products", id, await mapProduct(row), str(row.status));
    },
    async saveShopProduct(id, draft) {
      if (!isValidSlug(draft.slug)) throw new AdminClientError("invalid_slug");
      await writeOverlay("shop-products", id, { ...draft, id });
      return this.getShopProduct(id);
    },
    async publishShopProduct(id) {
      const current = await this.getShopProduct(id);
      const draft = assertSaved(current);
      const categories = await query("SELECT id FROM shop_categories WHERE id = $1", [Number(draft.categoryId)]);
      if (shopProductPublishBlockers(draft, categories.length > 0).length > 0) throw new AdminClientError("publish_blocked");
      await query(
        "UPDATE products SET name=$2, slug=$3, shop_category_id=$4, short_description=$5, price=$6, price_on_request=$7, main_image_id=$8, status='published', updated_at=now() WHERE id=$1",
        [
          Number(id),
          draft.name,
          draft.slug,
          Number(draft.categoryId),
          draft.descriptionShort,
          draft.price ?? null,
          draft.priceOnRequest,
          draft.mainImage ? Number(draft.mainImage.assetId) : null,
        ],
      );
      await clearOverlay("shop-products", id);
      return this.getShopProduct(id);
    },
    async hideShopProduct(id) {
      await publishStatus("products", id, "archived");
      return this.getShopProduct(id);
    },
    async deleteShopProduct(id) {
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
    async savePage(key, draft) {
      await writeOverlay("pages", key, draft);
      return this.getPage(key);
    },
    async publishPage(key) {
      const current = await this.getPage(key);
      const draft = assertSaved(current);
      await writePage(draft);
      await clearOverlay("pages", key);
      return this.getPage(key);
    },
    async resetPage(key) {
      await query("UPDATE pages SET status = 'draft', updated_at = now() WHERE key = $1", [key]);
      await clearOverlay("pages", key);
      return this.getPage(key);
    },
    async listMaterials() {
      const articles = await query("SELECT * FROM tire_iq_articles ORDER BY title");
      const stories = await query("SELECT * FROM people_stories ORDER BY title");
      const items = [];
      for (const row of articles) {
        const record = await present("materials", `article-${row.id}`, await mapArticle(row, "article"), str(row.status));
        items.push({
          id: record.id,
          title: record.draft.title,
          kind: record.draft.kind,
          status: documentStatus(record),
          hasUnpublishedDraft: record.publishedSnapshot != null && !sameJson(record.draft, record.publishedSnapshot),
        });
      }
      for (const row of stories) {
        const record = await present("materials", `story-${row.id}`, await mapArticle(row, "story"), str(row.status));
        items.push({
          id: record.id,
          title: record.draft.title,
          kind: "story" as const,
          status: documentStatus(record),
          hasUnpublishedDraft: false,
        });
      }
      return items;
    },
    async getMaterial(id) {
      const [kind, rawId] = id.split("-") as [ArticleDraft["kind"], string];
      const table = kind === "story" ? "people_stories" : "tire_iq_articles";
      const row = await requireRow(table, rawId);
      return present("materials", id, await mapArticle(row, kind), str(row.status));
    },
    async createMaterial(input) {
      const slug = slugifyTitle(input.title);
      if (!isValidSlug(slug)) throw new AdminClientError("invalid_slug");
      const table = input.kind === "story" ? "people_stories" : "tire_iq_articles";
      const rows = await query(`INSERT INTO ${table} (title, slug, content, status) VALUES ($1, $2, $3::jsonb, 'draft') RETURNING *`, [
        input.title.trim(),
        slug,
        JSON.stringify(lexical("")),
      ]);
      const id = `${input.kind}-${rows[0].id}`;
      return present("materials", id, await mapArticle(rows[0], input.kind), "draft");
    },
    async saveMaterial(id, draft) {
      if (!isValidSlug(draft.slug)) throw new AdminClientError("invalid_slug");
      await writeOverlay("materials", id, { ...draft, id });
      return this.getMaterial(id);
    },
    async publishMaterial(id) {
      const current = await this.getMaterial(id);
      const draft = assertSaved(current);
      if (articlePublishBlockers(draft).length > 0) throw new AdminClientError("publish_blocked");
      const rawId = id.split("-").slice(1).join("-");
      const table = draft.kind === "story" ? "people_stories" : "tire_iq_articles";
      await query(
        `UPDATE ${table} SET title=$2, slug=$3, excerpt=$4, content=$5::jsonb, status='published', updated_at=now() WHERE id=$1`,
        [Number(rawId), draft.title, draft.slug, draft.excerpt, JSON.stringify(lexical(draft.body))],
      );
      await clearOverlay("materials", id);
      return this.getMaterial(id);
    },
    async hideMaterial(id) {
      const current = await this.getMaterial(id);
      const table = current.draft.kind === "story" ? "people_stories" : "tire_iq_articles";
      await publishStatus(table, id.split("-").slice(1).join("-"), "archived");
      return this.getMaterial(id);
    },
    async deleteMaterial(id) {
      const current = await this.getMaterial(id);
      if (current.publishedSnapshot != null) throw new AdminClientError("publish_blocked");
      const table = current.draft.kind === "story" ? "people_stories" : "tire_iq_articles";
      await query(`DELETE FROM ${table} WHERE id = $1`, [Number(id.split("-").slice(1).join("-"))]);
    },
    async listUsers() {
      const rows = await query("SELECT id, email, name, role, status FROM users ORDER BY email");
      return rows.map(
        (row): AdminUser => ({
          id: str(row.id),
          login: str(row.email || row.name),
          role: str(row.role) === "admin" ? "admin" : "editor",
          disabled: str(row.status) !== "active",
        }),
      );
    },
    async createUser(input) {
      const rows = await query(
        "INSERT INTO users (name, email, role, status) VALUES ($1, $2, $3, 'active') RETURNING id, email, role, status",
        [input.login, input.login, input.role],
      );
      return { id: str(rows[0].id), login: str(rows[0].email), role: input.role, disabled: false };
    },
    async disableUser(id) {
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
      const users = await this.listUsers();
      const user = users.find((item) => item.id === id);
      if (user == null) throw new AdminClientError("publish_blocked");
      const admins = users.filter((item) => item.role === "admin" && !item.disabled);
      if (user.role === "admin" && role !== "admin" && admins.length <= 1) throw new AdminClientError("last_admin");
      await query("UPDATE users SET role = $2, updated_at = now() WHERE id = $1", [Number(id), role]);
      return { ...user, role };
    },
  };
}

async function writePage(draft: PageDraft) {
  if (draft.id === "home") {
    await query(
      `UPDATE pages SET title=$1, seo_seo_title=$2, seo_seo_description=$3,
        home_hero_eyebrow=$4, home_hero_title=$5, home_hero_lead=$6,
        home_hero_primary_cta_label=$7, home_hero_primary_cta_href=$8,
        home_hero_secondary_cta_label=$9, home_hero_secondary_cta_href=$10,
        home_hero_metric_label=$11, home_hero_metric_text=$12,
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
      ],
    );
    return;
  }
  if (draft.id === "shop-home") {
    await query(
      `UPDATE pages SET seo_seo_title=$1, seo_seo_description=$2, shop_hero_eyebrow=$3, shop_hero_title=$4, shop_hero_lead=$5, shop_hero_cta_label=$6, shop_hero_cta_href=$7, status='published', updated_at=now() WHERE key='shop-home'`,
      [draft.seoTitle, draft.seoDescription, draft.hero.eyebrow, draft.hero.title, draft.hero.lead, draft.hero.cta.label, draft.hero.cta.href],
    );
    return;
  }
  await query(
    `UPDATE pages SET seo_seo_title=$2, seo_seo_description=$3, stub_hero_eyebrow=$4, stub_hero_title=$5, stub_hero_lead=$6, status='published', updated_at=now() WHERE key=$1`,
    [draft.id, draft.seoTitle, draft.seoDescription, draft.hero.eyebrow, draft.hero.title, draft.hero.lead],
  );
}

export async function catalogPublishGaps(): Promise<string[]> {
  const client = createPostgresAdminClient();
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
