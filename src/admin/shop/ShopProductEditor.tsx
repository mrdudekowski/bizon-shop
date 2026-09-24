"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { browserAdminClient } from "@/admin/client/localStore";
import { AdminClientError } from "@/admin/client/errors";
import { shopProductPublishBlockers } from "@/admin/domain/publishRules";
import type {
  AdminRole,
  EntityRecord,
  ShopCategoryDraft,
  ShopProductDraft,
  ShopVariantDraft,
} from "@/admin/domain/types";
import { PlacementFields } from "@/admin/media/PlacementFields";

import styles from "./ShopDocument.module.css";

const ERROR_TEXT: Record<AdminClientError["code"], string> = {
  slug_taken: "Такой slug уже занят",
  invalid_slug: "Slug нельзя изменить",
  publish_blocked: "Публикация закрыта",
  unsaved: "Сначала сохраните черновик",
  media_in_use: "Файл ещё используется",
  cannot_disable_self: "Нельзя отключить себя",
  last_admin: "Нельзя отключить последнего администратора",
};

const BLOCKER_TEXT: Record<string, string> = {
  name: "Укажите название",
  slug: "Укажите slug",
  direction: "Выберите категорию",
  mainImage: "Добавьте главное фото",
  size: "Укажите размер варианта",
  price: "Укажите цену или «по запросу»",
  duplicateSize: "Размер повторяется",
};

function optionalNumber(raw: string): number | undefined {
  if (raw === "") return undefined;
  const next = Number(raw);
  return Number.isFinite(next) ? next : undefined;
}

function emptyVariant(): ShopVariantDraft {
  return {
    id: crypto.randomUUID(),
    color: "",
    size: "",
    sku: "",
    priceOnRequest: true,
    available: true,
  };
}

export function ShopProductEditor({ id }: { id: string }) {
  const router = useRouter();
  const [record, setRecord] = useState<EntityRecord<ShopProductDraft> | null>(null);
  const [draft, setDraft] = useState<ShopProductDraft | null>(null);
  const [categories, setCategories] = useState<EntityRecord<ShopCategoryDraft>[]>([]);
  const [role, setRole] = useState<AdminRole>("admin");
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const client = browserAdminClient();
    void Promise.all([client.getShopProduct(id), client.listShopCategories(), client.getSession()]).then(
      ([nextRecord, nextCategories, session]) => {
        setRecord(nextRecord);
        setDraft(nextRecord.draft);
        setCategories(nextCategories);
        setRole(session.role);
      },
    );
  }, [id]);

  if (draft == null || record == null) return <main className={styles.page}>Загрузка…</main>;
  const product = draft;
  const stored = record;

  const dirty = JSON.stringify(product) !== JSON.stringify(stored.savedDraft) || stored.savedDraft == null;
  const blockers = shopProductPublishBlockers(product);
  const savedBlockers = stored.savedDraft == null ? [] : shopProductPublishBlockers(stored.savedDraft);

  function patch(next: Partial<ShopProductDraft>) {
    setDraft((current) => (current == null ? current : { ...current, ...next }));
  }

  function patchVariant(index: number, next: Partial<ShopVariantDraft>) {
    const variants = product.variants.slice();
    variants[index] = { ...variants[index], ...next };
    patch({ variants });
  }

  function moveGallery(index: number, delta: -1 | 1) {
    const target = index + delta;
    if (target < 0 || target >= product.gallery.length) return;
    const gallery = product.gallery.slice();
    const [item] = gallery.splice(index, 1);
    gallery.splice(target, 0, item);
    patch({ gallery });
  }

  async function onSave() {
    setSaving(true);
    setMessage("");
    try {
      const saved = await browserAdminClient().saveShopProduct(id, product);
      setRecord(saved);
      setDraft(saved.draft);
    } catch (error) {
      setMessage(error instanceof AdminClientError ? ERROR_TEXT[error.code] : "Не удалось сохранить");
    } finally {
      setSaving(false);
    }
  }

  async function onPublish() {
    setPublishing(true);
    setMessage("");
    try {
      const published = await browserAdminClient().publishShopProduct(id);
      setRecord(published);
      setDraft(published.draft);
    } catch (error) {
      setMessage(error instanceof AdminClientError ? ERROR_TEXT[error.code] : "Не удалось опубликовать");
    } finally {
      setPublishing(false);
    }
  }

  return (
    <main className={styles.page}>
      <h1>{draft.name || "Товар"}</h1>
      <section className={styles.section}>
        <h2>Карточка</h2>
        <label className={styles.field}>
          Название
          <input value={draft.name} onChange={(event) => patch({ name: event.target.value })} />
        </label>
        <label className={styles.field}>
          Slug
          <input
            value={draft.slug}
            disabled={record.slugLocked}
            onChange={(event) => patch({ slug: event.target.value })}
          />
        </label>
        <label className={styles.field}>
          Категория
          <select value={draft.categoryId} onChange={(event) => patch({ categoryId: event.target.value })}>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.draft.name}
              </option>
            ))}
          </select>
        </label>
        <label className={styles.field}>
          Короткое описание
          <textarea
            value={draft.descriptionShort}
            onChange={(event) => patch({ descriptionShort: event.target.value })}
          />
        </label>
        <label className={styles.field}>
          Полное описание
          <textarea
            value={draft.descriptionLong}
            onChange={(event) => patch({ descriptionLong: event.target.value })}
          />
        </label>
        <label className={styles.field}>
          Цена
          <input
            type="number"
            value={draft.price ?? ""}
            onChange={(event) => patch({ price: optionalNumber(event.target.value) })}
          />
        </label>
        <label className={styles.check}>
          <input
            type="checkbox"
            checked={draft.priceOnRequest}
            onChange={(event) => patch({ priceOnRequest: event.target.checked })}
          />
          Цена по запросу
        </label>
      </section>
      <section className={styles.section}>
        <h2>Варианты</h2>
        {draft.variants.map((variant, index) => (
          <div key={variant.id} className={styles.row}>
            <label className={styles.field}>
              Цвет
              <input
                value={variant.color}
                onChange={(event) => patchVariant(index, { color: event.target.value })}
              />
            </label>
            <label className={styles.field}>
              Размер
              <input
                value={variant.size}
                onChange={(event) => patchVariant(index, { size: event.target.value })}
              />
            </label>
            <label className={styles.field}>
              SKU
              <input value={variant.sku} onChange={(event) => patchVariant(index, { sku: event.target.value })} />
            </label>
            {!variant.sku.trim() ? <span>SKU не заполнен</span> : null}
            <label className={styles.field}>
              Цена
              <input
                type="number"
                value={variant.price ?? ""}
                onChange={(event) => patchVariant(index, { price: optionalNumber(event.target.value) })}
              />
            </label>
            <label className={styles.check}>
              <input
                type="checkbox"
                checked={variant.priceOnRequest}
                onChange={(event) => patchVariant(index, { priceOnRequest: event.target.checked })}
              />
              по запросу
            </label>
            <label className={styles.check}>
              <input
                type="checkbox"
                checked={variant.available}
                onChange={(event) => patchVariant(index, { available: event.target.checked })}
              />
              в наличии
            </label>
            <PlacementFields
              label="Фото варианта"
              value={variant.image}
              onChange={(image) => patchVariant(index, { image })}
            />
            <div className={styles.rowActions}>
              <button
                type="button"
                onClick={() => patch({ variants: draft.variants.filter((item) => item.id !== variant.id) })}
              >
                Убрать
              </button>
            </div>
          </div>
        ))}
        <button type="button" onClick={() => patch({ variants: [...draft.variants, emptyVariant()] })}>
          Добавить вариант
        </button>
      </section>
      <section className={styles.section}>
        <h2>Медиа</h2>
        <PlacementFields
          label="Главное фото"
          value={draft.mainImage}
          onChange={(mainImage) => patch({ mainImage })}
        />
        <h3>Галерея</h3>
        {draft.gallery.map((item, index) => (
          <div key={`${item.assetId}-${index}`} className={styles.row}>
            <PlacementFields
              label={`Галерея ${index + 1}`}
              value={item}
              onChange={(next) => {
                if (next == null) {
                  patch({ gallery: draft.gallery.filter((_, i) => i !== index) });
                  return;
                }
                const gallery = draft.gallery.slice();
                gallery[index] = next;
                patch({ gallery });
              }}
            />
            <div className={styles.rowActions}>
              <button type="button" disabled={index === 0} onClick={() => moveGallery(index, -1)}>
                выше
              </button>
              <button
                type="button"
                disabled={index === draft.gallery.length - 1}
                onClick={() => moveGallery(index, 1)}
              >
                ниже
              </button>
            </div>
          </div>
        ))}
        <PlacementFields
          label="Добавить в галерею"
          value={undefined}
          onChange={(next) => {
            if (next == null) return;
            patch({ gallery: [...draft.gallery, next] });
          }}
        />
      </section>
      <div className={styles.actions}>
        <p>Сохранил: {record.lastSavedBy ?? "—"}</p>
        <p>Опубликовал: {record.lastPublishedBy ?? "—"}</p>
        {message ? <p>{message}</p> : null}
        {savedBlockers.map((code) => (
          <p key={code}>{BLOCKER_TEXT[code] ?? code}</p>
        ))}
        {dirty ? <p>Есть несохранённые правки</p> : null}
        <button type="button" disabled={saving} onClick={() => void onSave()}>
          {saving ? "Сохраняем…" : "Сохранить"}
        </button>
        {role === "admin" ? (
          <>
            <button
              type="button"
              disabled={dirty || publishing || savedBlockers.length > 0}
              onClick={() => void onPublish()}
            >
              {publishing ? "Публикуем…" : "Опубликовать"}
            </button>
            {record.publishedSnapshot != null ? (
              <button type="button" onClick={() => void browserAdminClient().hideShopProduct(id).then(setRecord)}>
                Скрыть с сайта
              </button>
            ) : (
              <button
                type="button"
                onClick={() => void browserAdminClient().deleteShopProduct(id).then(() => router.push("/shop"))}
              >
                Удалить
              </button>
            )}
          </>
        ) : null}
      </div>
    </main>
  );
}
