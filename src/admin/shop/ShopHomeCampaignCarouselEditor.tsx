"use client";

import { useEffect, useMemo, useState } from "react";
import { browserAdminClient } from "@/admin/client/localStore";
import { actionErrorText, DOCUMENT_STATUS } from "@/admin/client/actionFeedback";
import type { EntityRecord, MediaAsset, ShopCategoryDraft, ShopHomePageDraft } from "@/admin/domain/types";
import { resolveMediaPreviewUrl } from "@/admin/domain/catalogPreviewUrl";
import { canEditorPerform } from "@/admin/domain/editorPermissions";
import { AdminLoading } from "@/admin/ui/AdminLoading";
import { DocumentReviewFooter } from "@/admin/ui/DocumentReviewFooter";
import { useAdminSession } from "@/admin/ui/DocumentUI";
import { mergeShopHomeCategories } from "./shopHomeCategories";
import styles from "./ShopHomeCampaignCarouselEditor.module.css";

const DISK_ICON_URL = resolveMediaPreviewUrl("/images/shop/category-icons/tire.svg");

export function ShopHomeCampaignCarouselEditor() {
  const session = useAdminSession();
  const [record, setRecord] = useState<EntityRecord<ShopHomePageDraft> | null>(null);
  const [draft, setDraft] = useState<ShopHomePageDraft | null>(null);
  const [categories, setCategories] = useState<EntityRecord<ShopCategoryDraft>[]>([]);
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let active = true;
    const client = browserAdminClient();
    void Promise.all([
      client.getPage("shop-home"),
      client.listShopCategories(),
      client.listAssets(),
    ]).then(([page, nextCategories, nextAssets]) => {
      if (!active) return;
      const normalized = mergeShopHomeCategories(page.draft as ShopHomePageDraft, nextCategories);
      const savedBaseline = mergeShopHomeCategories((page.savedDraft ?? page.draft) as ShopHomePageDraft, nextCategories);
      setRecord({
        ...page,
        draft: normalized,
        savedDraft: savedBaseline,
        publishedSnapshot: page.publishedSnapshot as ShopHomePageDraft | null,
      });
      setDraft(normalized);
      setCategories(nextCategories);
      setAssets(nextAssets);
      setError("");
    }).catch(() => {
      if (active) setError("Не удалось загрузить настройки карусели Shop.");
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, []);

  const orderedTiles = useMemo(
    () => [...(draft?.catalog.tiles ?? [])].sort((a, b) => a.sortOrder - b.sortOrder),
    [draft],
  );

  if (loading) return <div className={styles.editor}><AdminLoading label="Загружаем карусель Shop…" /></div>;
  if (error) return <div className={styles.editor} role="alert">{error}</div>;
  if (record == null || draft == null) return <div className={styles.editor} role="alert">Не удалось загрузить настройки карусели Shop.</div>;
  if (session == null || !canEditorPerform(session, "edit_site_pages")) {
    return <div className={styles.editor}><h3>Нет доступа к настройкам карусели Shop</h3></div>;
  }

  const dirty = JSON.stringify(draft) !== JSON.stringify(record.savedDraft);
  const actionInProgress = saving || publishing;

  function patchCaption(categoryId: string, caption: string) {
    setDraft((current) => current == null ? current : ({
      ...current,
      catalog: {
        ...current.catalog,
        tiles: current.catalog.tiles.map((tile) => tile.categoryId === categoryId
          ? { ...tile, homeCarouselCaption: caption }
          : tile),
      },
    }));
  }

  async function save() {
    if (draft == null) return;
    setSaving(true);
    setMessage("");
    try {
      const saved = await browserAdminClient().savePage("shop-home", draft);
      const nextDraft = mergeShopHomeCategories(saved.draft as ShopHomePageDraft, categories);
      const savedBaseline = mergeShopHomeCategories((saved.savedDraft ?? saved.draft) as ShopHomePageDraft, categories);
      setRecord({ ...saved, draft: nextDraft, savedDraft: savedBaseline, publishedSnapshot: saved.publishedSnapshot as ShopHomePageDraft | null });
      setDraft(nextDraft);
      setMessage(DOCUMENT_STATUS.saved);
    } catch (saveError) {
      setMessage(actionErrorText(saveError, "Не удалось сохранить"));
    } finally {
      setSaving(false);
    }
  }

  async function publish() {
    setPublishing(true);
    setMessage("");
    try {
      const published = await browserAdminClient().publishPage("shop-home");
      const nextDraft = mergeShopHomeCategories(published.draft as ShopHomePageDraft, categories);
      const savedBaseline = mergeShopHomeCategories((published.savedDraft ?? published.draft) as ShopHomePageDraft, categories);
      setRecord({ ...published, draft: nextDraft, savedDraft: savedBaseline, publishedSnapshot: published.publishedSnapshot as ShopHomePageDraft | null });
      setDraft(nextDraft);
      setMessage(DOCUMENT_STATUS.published);
    } catch (publishError) {
      setMessage(actionErrorText(publishError, "Не удалось опубликовать"));
    } finally {
      setPublishing(false);
    }
  }

  const categoryById = new Map(categories.map((category) => [category.id, category]));
  function iconUrl(categoryId: string) {
    const category = categoryById.get(categoryId);
    const tile = draft?.catalog.tiles.find((item) => item.categoryId === categoryId);
    const assetId = tile?.icon?.assetId ?? category?.draft.mainImage?.assetId;
    const asset = assets.find((item) => item.id === assetId);
    return resolveMediaPreviewUrl(asset?.dataUrl);
  }

  return (
    <div className={styles.editor} data-unsaved={dirty ? "true" : undefined}>
      <div className={styles.heading}>
        <h3>Подписи карусели иконок</h3>
        <p>Иконки берутся из настроек категорий. Тексты сохраняются отдельно от содержимого страницы «Главная».</p>
      </div>
      <div className={styles.rows}>
        <div className={styles.row}>
          <div className={styles.iconFrame}>
            {DISK_ICON_URL ? <img src={DISK_ICON_URL} alt="Иконка дисков" /> : <span>Нет иконки</span>}
          </div>
          <label className={styles.captionField}>
            Подпись для карусели — Диски
            <input
              disabled={actionInProgress}
              value={draft.homeCarousel.diskCaption}
              onChange={(event) => setDraft({ ...draft, homeCarousel: { ...draft.homeCarousel, diskCaption: event.target.value } })}
            />
          </label>
        </div>
        {orderedTiles.map((tile) => {
          const previewUrl = iconUrl(tile.categoryId);
          const label = tile.title || `Категория ${tile.categoryId}`;
          return (
            <div className={styles.row} key={tile.categoryId}>
              <div className={styles.iconFrame}>
                {previewUrl ? <img src={previewUrl} alt={`Иконка категории ${label}`} /> : <span>Нет иконки</span>}
              </div>
              <label className={styles.captionField}>
                Подпись карусели: {label}
                <input disabled={actionInProgress} value={tile.homeCarouselCaption} onChange={(event) => patchCaption(tile.categoryId, event.target.value)} />
              </label>
            </div>
          );
        })}
        {orderedTiles.length === 0 ? <p className={styles.empty}>Категорий пока нет. Добавьте их в разделе Shop — категории.</p> : null}
      </div>
      <DocumentReviewFooter
        entityType="page"
        entityId="shop-home"
        dirty={dirty}
        saving={saving}
        saveDisabled={publishing}
        message={message}
        lastSavedBy={record.lastSavedBy}
        lastPublishedBy={record.lastPublishedBy}
        onSave={save}
        adminActions={<button type="button" disabled={dirty || actionInProgress} onClick={() => void publish()}>{publishing ? "Публикуем…" : "Опубликовать"}</button>}
      />
    </div>
  );
}
