"use client";

import { useEffect, useMemo, useState } from "react";
import { browserAdminClient } from "@/admin/client/localStore";
import { actionErrorText, DOCUMENT_STATUS } from "@/admin/client/actionFeedback";
import type { EntityRecord, ImagePlacement, ShopCategoryDraft, ShopHomePageDraft } from "@/admin/domain/types";
import { PlacementFields } from "@/admin/media/PlacementFields";
import { DocumentReviewFooter } from "@/admin/ui/DocumentReviewFooter";
import { AdminLoading } from "@/admin/ui/AdminLoading";
import { canEditorPerform } from "@/admin/domain/editorPermissions";
import { useAdminSession } from "@/admin/ui/DocumentUI";
import styles from "./ShopShowcaseEditor.module.css";

type Panel = "carousel" | "tiles" | "catalog";
const PANELS: { id: Panel; title: string }[] = [
  { id: "carousel", title: "Карусель главной" },
  { id: "tiles", title: "Плитки категорий" },
  { id: "catalog", title: "Страница каталога" },
];

function mergeCategories(page: ShopHomePageDraft, categories: EntityRecord<ShopCategoryDraft>[]): ShopHomePageDraft {
  const existing = new Map(page.catalog.tiles.map((tile) => [tile.categoryId, tile]));
  const tiles = categories.map(({ id, draft }, index) => {
    const tile = existing.get(id);
    return tile ?? {
      categoryId: id,
      title: draft.name,
      visible: draft.showInMenu,
      sortOrder: draft.sortOrder || index,
      carouselVisible: draft.carousel.length > 0,
      icon: draft.mainImage,
      image: draft.mainImage,
      carouselImage: draft.carousel[0]?.image,
    };
  });
  return { ...page, catalog: { ...page.catalog, tiles } };
}

export function ShopShowcaseEditor() {
  const session = useAdminSession();
  const [record, setRecord] = useState<EntityRecord<ShopHomePageDraft> | null>(null);
  const [draft, setDraft] = useState<ShopHomePageDraft | null>(null);
  const [panel, setPanel] = useState<Panel>("carousel");
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    void Promise.all([browserAdminClient().getPage("shop-home"), browserAdminClient().listShopCategories()])
      .then(([page, categories]) => {
        const normalized = mergeCategories(page.draft as ShopHomePageDraft, categories);
        setRecord({
          ...page,
          draft: normalized,
          savedDraft: page.savedDraft as ShopHomePageDraft | null,
          publishedSnapshot: page.publishedSnapshot as ShopHomePageDraft | null,
        });
        setDraft(normalized);
      })
      .catch(() => setMessage("Не удалось загрузить настройки Shop."));
  }, []);

  const orderedTiles = useMemo(() => [...(draft?.catalog.tiles ?? [])].sort((a, b) => a.sortOrder - b.sortOrder), [draft]);
  if (record == null || draft == null) return <main className={styles.page}><AdminLoading label="Загружаем настройки Shop…" /></main>;
  if (session == null || !canEditorPerform(session, "edit_site_pages")) return <main className={styles.page}><h1>Нет доступа</h1></main>;

  const dirty = JSON.stringify(draft) !== JSON.stringify(record.savedDraft);
  function patchTile(categoryId: string, update: (tile: ShopHomePageDraft["catalog"]["tiles"][number]) => ShopHomePageDraft["catalog"]["tiles"][number]) {
    setDraft((current) => current == null ? current : ({
      ...current,
      catalog: { ...current.catalog, tiles: current.catalog.tiles.map((tile) => tile.categoryId === categoryId ? update(tile) : tile) },
    }));
  }
  function patchPlacement(categoryId: string, field: "icon" | "image" | "carouselImage", image: ImagePlacement | undefined) {
    patchTile(categoryId, (tile) => ({ ...tile, [field]: image }));
  }
  async function save() {
    setSaving(true); setMessage("");
    try {
      const currentDraft = draft!;
      const saved = await browserAdminClient().savePage("shop-home", currentDraft);
      setRecord(saved as EntityRecord<ShopHomePageDraft>); setDraft(saved.draft as ShopHomePageDraft); setMessage(DOCUMENT_STATUS.saved);
    } catch (error) { setMessage(actionErrorText(error, "Не удалось сохранить")); }
    finally { setSaving(false); }
  }
  async function publish() {
    setPublishing(true); setMessage("");
    try {
      const published = await browserAdminClient().publishPage("shop-home");
      setRecord(published as EntityRecord<ShopHomePageDraft>); setDraft(published.draft as ShopHomePageDraft); setMessage(DOCUMENT_STATUS.published);
    } catch (error) { setMessage(actionErrorText(error, "Не удалось опубликовать")); }
    finally { setPublishing(false); }
  }

  return (
    <main className={styles.page} data-unsaved={dirty ? "true" : undefined}>
      <header className={styles.heading}><h1>Shop</h1><p>Управление каруселью, плитками и содержимым каталога.</p></header>
      <nav className={styles.tabs} role="tablist" aria-label="Настройки Shop">
        {PANELS.map((item) => <button key={item.id} type="button" role="tab" aria-selected={panel === item.id} onClick={() => setPanel(item.id)}>{item.title}</button>)}
      </nav>
      {panel === "carousel" ? <section className={styles.list} aria-label="Карусель главной">
        <h2>Карусель категорий на главной</h2>
        <p>Название и адрес ссылки берутся из категории. Здесь настраиваются показ и фотография.</p>
        {orderedTiles.map((tile) => <article className={styles.card} key={tile.categoryId}>
          <div className={styles.cardHead}><h3>{tile.title || `Категория ${tile.categoryId}`}</h3><label className={styles.check}><input type="checkbox" checked={tile.carouselVisible} onChange={(e) => patchTile(tile.categoryId, (row) => ({ ...row, carouselVisible: e.target.checked }))} /> Показывать в карусели</label></div>
          <PlacementFields label="Фото для карусели" value={tile.carouselImage} onChange={(image) => patchPlacement(tile.categoryId, "carouselImage", image)} />
        </article>)}
      </section> : null}
      {panel === "tiles" ? <section className={styles.list} aria-label="Плитки категорий">
        <h2>Плитки категорий</h2>
        {orderedTiles.map((tile) => <article className={styles.card} key={tile.categoryId}>
          <label className={styles.field}>Название плитки<input value={tile.title} onChange={(e) => patchTile(tile.categoryId, (row) => ({ ...row, title: e.target.value }))} /></label>
          <label className={styles.field}>Порядок<input type="number" value={tile.sortOrder} onChange={(e) => patchTile(tile.categoryId, (row) => ({ ...row, sortOrder: Number(e.target.value) || 0 }))} /></label>
          <label className={styles.check}><input type="checkbox" checked={tile.visible} onChange={(e) => patchTile(tile.categoryId, (row) => ({ ...row, visible: e.target.checked }))} /> Показывать на сайте</label>
          <PlacementFields label="Иконка" value={tile.icon} onChange={(image) => patchPlacement(tile.categoryId, "icon", image)} />
          <PlacementFields label="Изображение плитки" value={tile.image} onChange={(image) => patchPlacement(tile.categoryId, "image", image)} />
        </article>)}
      </section> : null}
      {panel === "catalog" ? <section className={styles.list} aria-label="Содержимое страницы каталога">
        <h2>Страница каталога</h2>
        {(["eyebrow", "title", "lead", "sectionTitle"] as const).map((field) => <label className={styles.field} key={field}>{({ eyebrow: "Надзаголовок", title: "Заголовок", lead: "Вводный текст", sectionTitle: "Заголовок списка категорий" })[field]}{field === "lead" ? <textarea value={draft.catalog.copy[field]} onChange={(e) => setDraft({ ...draft, catalog: { ...draft.catalog, copy: { ...draft.catalog.copy, [field]: e.target.value } } })} /> : <input value={draft.catalog.copy[field]} onChange={(e) => setDraft({ ...draft, catalog: { ...draft.catalog, copy: { ...draft.catalog.copy, [field]: e.target.value } } })} />}</label>)}
      </section> : null}
      <DocumentReviewFooter entityType="page" entityId="shop-home" dirty={dirty} saving={saving} message={message} lastSavedBy={record.lastSavedBy} lastPublishedBy={record.lastPublishedBy} onSave={save} adminActions={<button type="button" disabled={dirty || publishing} onClick={() => void publish()}>{publishing ? "Публикуем…" : "Опубликовать"}</button>} />
    </main>
  );
}
