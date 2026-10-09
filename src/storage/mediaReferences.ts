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
    ["pages", "shop_hero_image_id"],
    ["pages", "stub_hero_image_id"],
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
  for (const table of ["tire_models_rels", "wheel_models_rels", "products_rels"]) {
    await query(`DELETE FROM ${table} WHERE media_id = $1`, [mediaId]);
  }

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
