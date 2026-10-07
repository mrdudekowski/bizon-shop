"use client";

import { useAdminRole } from "@/admin/ui/DocumentUI";
import { DocumentReviewFooter } from "@/admin/ui/DocumentReviewFooter";
import { AdminLoading } from "@/admin/ui/AdminLoading";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { browserAdminClient } from "@/admin/client/localStore";
import { AdminClientError } from "@/admin/client/errors";
import { DOCUMENT_STATUS, actionErrorText } from "@/admin/client/actionFeedback";
import { wheelTypePublishBlockers } from "@/admin/domain/publishRules";
import type { EntityRecord, ShopCategoryDraft } from "@/admin/domain/types";
import type { PublishBlockerHint } from "@/admin/ui/documentTabs";
import { ShopCategoryProducts } from "./ShopCategoryProducts";

import styles from "./ShopDocument.module.css";

const BLOCKER_TEXT: Record<string, PublishBlockerHint> = {
  name: { text: "Укажите название", tab: "Карточка категории", field: "Название" },
  slug: { text: "Укажите адрес страницы", tab: "Карточка категории", field: "Адрес" },
};

const CATEGORY_TABS = ["products", "settings"] as const;
type CategoryTab = (typeof CATEGORY_TABS)[number];

export function ShopCategoryEditor({ id }: { id: string }) {
  const router = useRouter();
  const tabsRef = useRef<HTMLElement>(null);
  const [record, setRecord] = useState<EntityRecord<ShopCategoryDraft> | null>(null);
  const [draft, setDraft] = useState<ShopCategoryDraft | null>(null);
  const [role, setRole] = useAdminRole();
  const [activeTab, setActiveTab] = useState<CategoryTab>("products");
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [message, setMessage] = useState("");
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    const client = browserAdminClient();
    void Promise.all([client.getShopCategory(id), client.getSession()])
      .then(([next, session]) => {
        setRecord(next);
        setDraft(next.draft);
        setRole(session.role);
      })
      .catch(() => setMissing(true));
  }, [id, setRole]);

  if (missing) return <main className={styles.page}>Категория не найдена</main>;
  if (draft == null || record == null) return <main className={styles.page}><AdminLoading /></main>;

  const dirty = JSON.stringify(draft) !== JSON.stringify(record.savedDraft) || record.savedDraft == null;
  const savedBlockers = record.savedDraft == null ? [] : wheelTypePublishBlockers(record.savedDraft);

  function patch(next: Partial<ShopCategoryDraft>) {
    setDraft((current) => (current == null ? current : { ...current, ...next }));
  }

  function selectTab(tab: CategoryTab) {
    setActiveTab(tab);
  }

  function onTabKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight" && event.key !== "Home" && event.key !== "End") return;
    event.preventDefault();
    const tabs = Array.from(tabsRef.current?.querySelectorAll<HTMLButtonElement>("[role='tab']") ?? []);
    const currentIndex = tabs.indexOf(event.currentTarget);
    const nextIndex = event.key === "Home" ? 0 : event.key === "End" ? tabs.length - 1 : (currentIndex + (event.key === "ArrowRight" ? 1 : tabs.length - 1)) % tabs.length;
    tabs[nextIndex]?.focus();
    const nextTab = CATEGORY_TABS[nextIndex];
    if (nextTab) setActiveTab(nextTab);
  }

  async function onSave() {
    setSaving(true);
    setMessage("");
    try {
      const saved = await browserAdminClient().saveShopCategory(id, draft!);
      setRecord(saved);
      setDraft(saved.draft);
      setMessage(DOCUMENT_STATUS.saved);
    } catch (error) {
      setMessage(actionErrorText(error, "Не удалось сохранить"));
    } finally {
      setSaving(false);
    }
  }

  async function onPublish() {
    setPublishing(true);
    setMessage("");
    try {
      const published = await browserAdminClient().publishShopCategory(id);
      setRecord(published);
      setDraft(published.draft);
      setMessage(DOCUMENT_STATUS.published);
    } catch (error) {
      setMessage(actionErrorText(error, "Не удалось опубликовать"));
    } finally {
      setPublishing(false);
    }
  }

  async function onDelete() {
    try {
      await browserAdminClient().deleteShopCategory(id);
      router.push("/shop");
    } catch (error) {
      setMessage(
        error instanceof AdminClientError && error.code === "publish_blocked"
          ? "Нельзя удалить: есть связанные записи"
          : actionErrorText(error, "Не удалось удалить"),
      );
    }
  }

  async function onHideCategory() {
    setMessage("");
    try {
      setRecord(await browserAdminClient().hideShopCategory(id));
      setMessage(DOCUMENT_STATUS.hidden);
    } catch (error) {
      setMessage(actionErrorText(error, "Не удалось скрыть категорию"));
    }
  }

  return (
    <main className="document" data-unsaved={dirty ? "true" : undefined}>
      <Link className="backLink" href="/shop">← Назад к категориям</Link>
      <h1>{draft.name || "Категория shop"}</h1>
      <nav ref={tabsRef} className="blockNav" role="tablist" aria-label="Разделы категории">
        <button id="shop-category-products-tab" type="button" role="tab" aria-selected={activeTab === "products"} aria-controls="shop-category-products-panel" tabIndex={activeTab === "products" ? 0 : -1} onClick={() => selectTab("products")} onKeyDown={onTabKeyDown}>Товары</button>
        <button id="shop-category-settings-tab" type="button" role="tab" aria-selected={activeTab === "settings"} aria-controls="shop-category-settings-panel" tabIndex={activeTab === "settings" ? 0 : -1} onClick={() => selectTab("settings")} onKeyDown={onTabKeyDown}>Настройки категории</button>
      </nav>

      <div id="shop-category-products-panel" role="tabpanel" aria-labelledby="shop-category-products-tab" tabIndex={0} hidden={activeTab !== "products"}>
        <ShopCategoryProducts categoryId={id} categoryName={draft.name || "Без названия"} />
      </div>

      <div id="shop-category-settings-panel" className={styles.tabPanel} role="tabpanel" aria-labelledby="shop-category-settings-tab" tabIndex={0} hidden={activeTab !== "settings"}>
        <section className={styles.section}>
          <h2>Карточка категории</h2>
          <label className={styles.field}>
            Название
            <input value={draft.name} onChange={(event) => patch({ name: event.target.value })} />
          </label>
          <label className={styles.field}>
            Адрес
            <input
              value={draft.slug}
              disabled={record.slugLocked}
              onChange={(event) => patch({ slug: event.target.value })}
            />
          </label>
          <label className={styles.field}>
            Описание
            <textarea value={draft.description} onChange={(event) => patch({ description: event.target.value })} />
          </label>
        </section>
      </div>

      <DocumentReviewFooter
          entityType="shop-category"
          entityId={id}
          dirty={dirty}
          saving={saving}
          message={message}
          blockers={savedBlockers.map((code) => BLOCKER_TEXT[code] ?? { text: code })}
          lastSavedBy={record.lastSavedBy}
          lastPublishedBy={record.lastPublishedBy}
          onSave={onSave}
          adminActions={
            <>
              <button
                type="button"
                disabled={dirty || publishing || savedBlockers.length > 0}
                onClick={() => void onPublish()}
              >
                {publishing ? "Публикуем…" : "Опубликовать"}
              </button>
              {record.publishedSnapshot != null ? (
                <button type="button" onClick={() => void onHideCategory()}>
                  Скрыть с сайта
                </button>
              ) : (
                <button type="button" onClick={() => void onDelete()}>Удалить</button>
              )}
            </>
          }
        />
    </main>
  );
}
