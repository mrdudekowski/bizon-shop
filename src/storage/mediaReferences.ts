const MEDIA_REFERENCE_FIELDS = new Set(["assetId", "replacementAssetId", "imageAssetId", "mediaId", "media_id", "featuredImageId"]);

export function hasMediaReference(value: unknown, mediaId: string): boolean {
  if (Array.isArray(value)) return value.some((item) => hasMediaReference(item, mediaId));
  if (value == null || typeof value !== "object") return false;

  for (const [key, child] of Object.entries(value)) {
    if (MEDIA_REFERENCE_FIELDS.has(key) && child != null && String(child) === mediaId) return true;
    if (hasMediaReference(child, mediaId)) return true;
  }
  return false;
}

export function unlinkMediaReferences(value: unknown, mediaId: string): unknown {
  if (Array.isArray(value)) return value.map((item) => unlinkMediaReferences(item, mediaId));
  if (value == null || typeof value !== "object") return value;

  return Object.fromEntries(Object.entries(value).map(([key, child]) => [
    key,
    MEDIA_REFERENCE_FIELDS.has(key) && child != null && String(child) === mediaId
      ? null
      : unlinkMediaReferences(child, mediaId),
  ]));
}

type MediaReferenceRow = Record<string, unknown>;
type MediaReferenceQuery = (text: string, params?: unknown[]) => Promise<MediaReferenceRow[]>;

const DETACHABLE_MEDIA_SOURCES = new Map<string, { kind: "column" | "relation"; column: string }>([
  ["tire_types|cover_image_id", { kind: "column", column: "cover_image_id" }],
  ["tire_models|main_image_id", { kind: "column", column: "main_image_id" }],
  ["wheel_types|cover_image_id", { kind: "column", column: "cover_image_id" }],
  ["wheel_models|main_image_id", { kind: "column", column: "main_image_id" }],
  ["shop_categories|cover_image_id", { kind: "column", column: "cover_image_id" }],
  ["shop_category_carousel|image_id", { kind: "column", column: "image_id" }],
  ["products|main_image_id", { kind: "column", column: "main_image_id" }],
  ["tire_iq_articles|featured_image_id", { kind: "column", column: "featured_image_id" }],
  ...[
    "home_hero_image_id", "home_selection_entry_image_id", "home_shop_campaign_image_id", "home_expertise_image_id",
    "home_branding_before_image_id", "home_branding_after_image_id", "shop_hero_image_id", "stub_hero_image_id",
    "editorial_proof_image_id",
  ].map((column) => [`pages|${column}`, { kind: "column" as const, column }] as const),
  ...[
    "desktop_image_id", "mobile_image_id",
  ].map((column) => [`pages_shop_category_carousel|${column}`, { kind: "column" as const, column }] as const),
  ["pages_shop_vehicles_slides|image_id", { kind: "column", column: "image_id" }],
  ...["icon_media_id", "image_media_id", "carousel_image_media_id"].map((column) =>
    [`pages_shop_catalog_tiles|${column}`, { kind: "column" as const, column }] as const),
  ...["tire_models_rels", "wheel_models_rels", "products_rels", "products_variants_rels"].map((table) =>
    [`${table}|media_id`, { kind: "relation" as const, column: "media_id" }] as const),
  ["shop_category_carousel|image_id", { kind: "column", column: "image_id" }],
  ["cms_document_links|media_id", { kind: "relation", column: "media_id" }],
]);

/** Detach one exact persisted link; returns false when it has changed since it was listed. */
export async function detachStoredMediaReference(query: MediaReferenceQuery, mediaId: string, sourceKey: string): Promise<boolean> {
  const [table, column, ownerId, ...extra] = sourceKey.split("|");
  const source = DETACHABLE_MEDIA_SOURCES.get(`${table}|${column}`);
  const mediaNumericId = Number(mediaId);
  const ownerNumericId = Number(ownerId);
  if (!source || extra.length > 0 || !Number.isSafeInteger(mediaNumericId) || mediaNumericId <= 0 || !Number.isSafeInteger(ownerNumericId) || ownerNumericId <= 0) {
    return false;
  }
  const sql = source.kind === "column"
    ? `UPDATE ${table} SET ${source.column} = NULL WHERE id = $2 AND ${source.column} = $1 RETURNING id`
    : `DELETE FROM ${table} WHERE id = $2 AND ${source.column} = $1 RETURNING id`;
  const rows = await query(sql, [mediaNumericId, ownerNumericId]);
  return rows.length === 1;
}

export async function unlinkStoredMediaReferences(query: MediaReferenceQuery, id: string): Promise<void> {
  const mediaId = Number(id);
  const columnsToClear = [
    ["tire_types", "cover_image_id"],
    ["tire_models", "main_image_id"],
    ["wheel_types", "cover_image_id"],
    ["wheel_models", "main_image_id"],
    ["shop_categories", "cover_image_id"],
    ["shop_category_carousel", "image_id"],
    ["products", "main_image_id"],
    ["tire_iq_articles", "featured_image_id"],
    ["pages", "home_hero_image_id"],
    ["pages", "home_selection_entry_image_id"],
    ["pages", "home_shop_campaign_image_id"],
    ["pages", "home_expertise_image_id"],
    ["pages", "home_branding_before_image_id"],
    ["pages", "home_branding_after_image_id"],
    ["pages", "shop_hero_image_id"],
    ["pages", "stub_hero_image_id"],
    ["pages", "editorial_proof_image_id"],
    ["pages_shop_category_carousel", "desktop_image_id"],
    ["pages_shop_category_carousel", "mobile_image_id"],
    ["pages_shop_vehicles_slides", "image_id"],
    ["pages_shop_catalog_tiles", "icon_media_id"],
    ["pages_shop_catalog_tiles", "image_media_id"],
    ["pages_shop_catalog_tiles", "carousel_image_media_id"],
  ] as const;
  for (const [table, column] of columnsToClear) {
    await query(`UPDATE ${table} SET ${column} = NULL WHERE ${column} = $1`, [mediaId]);
  }
  for (const table of ["tire_models_rels", "wheel_models_rels", "products_rels", "products_variants_rels"]) {
    await query(`DELETE FROM ${table} WHERE media_id = $1`, [mediaId]);
  }
  await query("DELETE FROM cms_document_links WHERE media_id = $1", [mediaId]);

  const drafts = await query("SELECT collection, doc_id, draft FROM cms_drafts FOR UPDATE");
  for (const row of drafts) {
    if (!hasMediaReference(row.draft, id)) continue;
    await query(
      "UPDATE cms_drafts SET draft = $3::jsonb WHERE collection = $1 AND doc_id = $2",
      [String(row.collection ?? ""), String(row.doc_id ?? ""), JSON.stringify(unlinkMediaReferences(row.draft, id))],
    );
  }
  const changeSets = await query("SELECT id, pack FROM cms_change_sets FOR UPDATE");
  for (const row of changeSets) {
    if (!hasMediaReference(row.pack, id)) continue;
    await query("UPDATE cms_change_sets SET pack = $2::jsonb WHERE id = $1", [
      String(row.id ?? ""), JSON.stringify(unlinkMediaReferences(row.pack, id)),
    ]);
  }
}

export async function removePendingMediaReplacement(
  query: MediaReferenceQuery,
  targetId: string,
  afterCommit: (callback: () => Promise<void>) => void,
  deleteObject: (key: string) => Promise<void>,
): Promise<void> {
  const pending = await query(
    `SELECT staged.id, staged.object_key FROM cms_media_replacements AS pending
     JOIN media AS staged ON staged.id = pending.staged_media_id
     WHERE pending.target_media_id = $1 FOR UPDATE OF staged`,
    [Number(targetId)],
  );
  if (pending.length === 0) return;

  const stagedId = String(pending[0].id ?? "");
  const stagedKey = String(pending[0].object_key ?? "");
  await unlinkStoredMediaReferences(query, stagedId);
  if (stagedKey.startsWith("bizon/media/")) {
    await query(
      `INSERT INTO cms_media_cleanup (object_key, reason)
       VALUES ($1, 'media_replacement_cancelled_by_delete')
       ON CONFLICT (object_key) DO UPDATE SET reason = EXCLUDED.reason`,
      [stagedKey],
    );
  }
  await query("DELETE FROM cms_media_replacements WHERE target_media_id = $1", [Number(targetId)]);
  await query("DELETE FROM media WHERE id = $1", [Number(stagedId)]);
  if (stagedKey.startsWith("bizon/media/")) {
    afterCommit(async () => {
      try {
        await deleteObject(stagedKey);
        await query("DELETE FROM cms_media_cleanup WHERE object_key = $1", [stagedKey]);
      } catch {
        console.error("media.replacement_delete_cleanup_queued", { key: stagedKey });
      }
    });
  }
}
