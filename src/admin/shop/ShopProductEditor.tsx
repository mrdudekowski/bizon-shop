"use client";

import { BlockNav, useAdminRole } from "@/admin/ui/DocumentUI";
import { DocumentReviewFooter } from "@/admin/ui/DocumentReviewFooter";
import { AdminLoading } from "@/admin/ui/AdminLoading";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { browserAdminClient } from "@/admin/client/localStore";
import { AdminClientError } from "@/admin/client/errors";
import { DOCUMENT_STATUS, actionErrorText } from "@/admin/client/actionFeedback";
import { shopProductPublishBlockers } from "@/admin/domain/publishRules";
import type {
  EntityRecord,
  ShopCategoryDraft,
  ShopProductDraft,
  ShopSubcategoryDraft,
  ShopVariantDraft,
} from "@/admin/domain/types";
import { PlacementFields, ProductPhotoFields } from "@/admin/media/PlacementFields";
import { CatalogCreateDialog } from "@/admin/ui/CatalogCreateDialog";
import type { PublishBlockerHint } from "@/admin/ui/documentTabs";
import { slugifyTitle } from "@/admin/domain/slug";

import styles from "./ShopDocument.module.css";

const BLOCKER_TEXT: Record<string, PublishBlockerHint> = {
  name: { text: "Укажите название", tab: "Карточка", field: "Название" },
  slug: { text: "Укажите адрес страницы", tab: "Карточка", field: "Адрес" },
  direction: { text: "Выберите категорию", tab: "Карточка", field: "Категория" },
  mainImage: { text: "Добавьте главное фото", tab: "Фото", anchor: "main" },
  size: { text: "Укажите размер варианта", tab: "Варианты", field: "Размер" },
  price: { text: "Укажите цену или «по запросу»", tab: "Карточка", field: "Цена" },
  duplicateSize: { text: "Сочетание характеристик варианта повторяется", tab: "Варианты" },
  duplicateSku: { text: "Артикул (SKU) повторяется", tab: "Варианты", field: "SKU" },
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
    configuration: "",
    sku: "",
    priceOnRequest: true,
    available: true,
  };
}

export function ShopProductEditor({ id }: { id: string }) {
  const router = useRouter();
  const subcategoryDialogRef = useRef<HTMLDialogElement>(null);
  const subcategoryDeleteDialogRef = useRef<HTMLDialogElement>(null);
  const [record, setRecord] = useState<EntityRecord<ShopProductDraft> | null>(null);
  const [draft, setDraft] = useState<ShopProductDraft | null>(null);
  const [categories, setCategories] = useState<EntityRecord<ShopCategoryDraft>[]>([]);
  const [subcategories, setSubcategories] = useState<ShopSubcategoryDraft[]>([]);
  const [subcategoryName, setSubcategoryName] = useState("");
  const [subcategorySlug, setSubcategorySlug] = useState("");
  const [subcategorySlugTouched, setSubcategorySlugTouched] = useState(false);
  const [editingSubcategoryId, setEditingSubcategoryId] = useState<string | null>(null);
  const [subcategoryNotice, setSubcategoryNotice] = useState("");
  const [subcategoryDeleteError, setSubcategoryDeleteError] = useState("");
  const [role, setRole] = useAdminRole();
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const client = browserAdminClient();
    void Promise.all([client.getShopProduct(id), client.listShopCategories(), client.getSession()]).then(
      async ([nextRecord, nextCategories, session]) => {
        setRecord(nextRecord);
        setDraft(nextRecord.draft);
        setCategories(nextCategories);
        setSubcategories(await client.listShopSubcategories(nextRecord.draft.categoryId));
        setRole(session.role);
      },
    ).catch(() => setMessage("Не удалось загрузить карточку товара и подкатегории."));
  }, [id, setRole]);

  if (draft == null || record == null) return <main className={styles.page}><AdminLoading /></main>;
  const product = draft;
  const stored = record;

  const dirty = JSON.stringify(product) !== JSON.stringify(stored.savedDraft) || stored.savedDraft == null;
  const saved = stored.savedDraft;
  const savedBlockers =
    saved == null
      ? []
      : shopProductPublishBlockers(
          saved,
          categories.some((category) => category.id === saved.categoryId),
        );
  const selectedCategory = categories.find((category) => category.id === product.categoryId);
  const categoryPublished = selectedCategory?.publishedSnapshot != null && !selectedCategory.hidden;
  const parentPublicationBlocked = !categoryPublished;

  function patch(next: Partial<ShopProductDraft>) {
    setDraft((current) => (current == null ? current : { ...current, ...next }));
  }

  async function changeCategory(categoryId: string) {
    const hadSubcategory = Boolean(product.subcategoryId);
    patch({ categoryId, subcategoryId: undefined });
    setSubcategoryNotice(hadSubcategory ? "Подкатегория очищена: она относится к прежней категории." : "");
    try {
      setSubcategories(await browserAdminClient().listShopSubcategories(categoryId));
    } catch {
      setSubcategories([]);
      setMessage("Не удалось загрузить подкатегории выбранной категории.");
    }
  }

  function openSubcategoryDialog(subcategory?: ShopSubcategoryDraft) {
    setEditingSubcategoryId(subcategory?.id ?? null);
    setSubcategoryName(subcategory?.name ?? "");
    setSubcategorySlug(subcategory?.slug ?? "");
    setSubcategorySlugTouched(Boolean(subcategory));
    subcategoryDialogRef.current?.showModal();
  }

  async function createSubcategory() {
    if (!product.categoryId || !subcategoryName.trim()) return;
    const input = {
      name: subcategoryName.trim(),
      slug: slugifyTitle(subcategorySlugTouched ? subcategorySlug : subcategoryName),
    };
    const client = browserAdminClient();
    if (editingSubcategoryId) {
      const updated = await client.saveShopSubcategory(editingSubcategoryId, input);
      setSubcategories((current) => current.map((item) => item.id === updated.id ? updated : item));
    } else {
      const created = await client.createShopSubcategory({ ...input, categoryId: product.categoryId });
      setSubcategories((current) => [...current, created].sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name, "ru")));
      patch({ subcategoryId: created.id });
    }
    setSubcategoryNotice("");
    subcategoryDialogRef.current?.close();
  }

  async function deleteSelectedSubcategory() {
    if (!product.subcategoryId) return;
    try {
      await browserAdminClient().deleteShopSubcategory(product.subcategoryId);
      setSubcategories((current) => current.filter((item) => item.id !== product.subcategoryId));
      patch({ subcategoryId: undefined });
      setSubcategoryNotice("");
      subcategoryDeleteDialogRef.current?.close();
    } catch (error) {
      setSubcategoryDeleteError(
        error instanceof AdminClientError && error.code === "publish_blocked"
          ? "Подкатегория назначена товарам. Сначала смените её у этих товаров и сохраните карточки."
          : "Не удалось удалить подкатегорию. Попробуйте ещё раз.",
      );
    }
  }

  function patchVariant(index: number, next: Partial<ShopVariantDraft>) {
    const variants = product.variants.slice();
    variants[index] = { ...variants[index], ...next };
    patch({ variants });
  }


  async function onSave() {
    setSaving(true);
    setMessage("");
    try {
      const saved = await browserAdminClient().saveShopProduct(id, product);
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
      const published = await browserAdminClient().publishShopProduct(id);
      setRecord(published);
      setDraft(published.draft);
      setMessage(DOCUMENT_STATUS.published);
    } catch (error) {
      setMessage(actionErrorText(error, "Не удалось опубликовать"));
    } finally {
      setPublishing(false);
    }
  }

  async function onHide() {
    try {
      setRecord(await browserAdminClient().hideShopProduct(id));
      setMessage(DOCUMENT_STATUS.hidden);
    } catch (error) {
      setMessage(actionErrorText(error, "Не удалось скрыть"));
    }
  }

  async function onDelete() {
    try {
      await browserAdminClient().deleteShopProduct(id);
      router.push("/shop");
    } catch (error) {
      setMessage(actionErrorText(error, "Не удалось удалить"));
    }
  }

  return (
    <main className="document" data-unsaved={dirty ? "true" : undefined}>
      <Link className="backLink" href={`/shop/category-editor?id=${encodeURIComponent(draft.categoryId)}`}>← Назад к категории</Link>
      <h1>{draft.name || "Товар"}</h1>
      <BlockNav />
      <section className={styles.section}>
        <h2>Карточка</h2>
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
          Категория
          <select value={draft.categoryId} onChange={(event) => void changeCategory(event.target.value)}>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.draft.name}
              </option>
            ))}
          </select>
        </label>
        <div className={styles.subcategoryControl}>
          <label className={styles.field}>
            Подкатегория
            <select
              value={draft.subcategoryId ?? ""}
              disabled={!draft.categoryId || subcategories.length === 0}
              onChange={(event) => {
                patch({ subcategoryId: event.target.value || undefined });
                setSubcategoryNotice("");
              }}
            >
              <option value="">Без подкатегории</option>
              {subcategories.map((subcategory) => (
                <option key={subcategory.id} value={subcategory.id}>{subcategory.name}</option>
              ))}
            </select>
          </label>
          <button type="button" className="ghost" disabled={!draft.categoryId} onClick={() => openSubcategoryDialog()}>
            Создать подкатегорию
          </button>
          {draft.subcategoryId ? (
            <div className={styles.subcategoryActions}>
              <button
                type="button"
                className="ghost"
                onClick={() => openSubcategoryDialog(subcategories.find((item) => item.id === draft.subcategoryId))}
              >
                Переименовать
              </button>
              <button
                type="button"
                className={styles.subcategoryDelete}
                onClick={() => {
                  setSubcategoryDeleteError("");
                  subcategoryDeleteDialogRef.current?.showModal();
                }}
              >
                Удалить подкатегорию
              </button>
            </div>
          ) : null}
          {subcategoryNotice ? <p className={styles.inlineNotice} role="status">{subcategoryNotice}</p> : null}
          {!subcategories.length ? <p className={styles.inlineHint}>Создайте подкатегорию здесь — она станет доступна в фильтрах этой категории.</p> : null}
        </div>
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
          Артикул (SKU)
          <input
            value={draft.sku ?? ""}
            placeholder="Например, BZN-SHP-001"
            onChange={(event) => patch({ sku: event.target.value })}
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
        <label className={styles.field}>
          Цена до скидки
          <input
            type="number"
            min="0"
            value={draft.oldPrice ?? ""}
            onChange={(event) => patch({ oldPrice: optionalNumber(event.target.value) })}
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
        <label className={styles.check}>
          <input
            type="checkbox"
            checked={draft.available !== false}
            onChange={(event) => patch({ available: event.target.checked })}
          />
          В наличии
        </label>
      </section>
      <section className={styles.section}>
        <h2>Характеристики</h2>
        <div className="specsGroup">
          <div className="specsHeader">
            <h3>Основные характеристики товара</h3>
            <p className="subheading">Бренд, материал и дополнительные параметры, отображаемые на странице товара.</p>
          </div>
          <div className="specsFieldsGrid">
            <label className={styles.field}>
              Бренд
              <input
                value={draft.brand ?? ""}
                placeholder="Например, BIZON"
                onChange={(event) => patch({ brand: event.target.value })}
              />
            </label>
            <label className={styles.field}>
              Материал
              <input
                value={draft.material ?? ""}
                placeholder="Например, Алюминий / Кожа / Полиуретан"
                onChange={(event) => patch({ material: event.target.value })}
              />
            </label>
          </div>
          <div className="collection" style={{ "--collection-columns": "minmax(140px, 1fr) minmax(160px, 1.4fr) 44px" } as React.CSSProperties}>
            {(draft.specifications ?? []).length > 0 ? (
              <div className="collectionHead" aria-hidden="true">
                <span>Название характеристики</span>
                <span>Значение</span>
                <span />
              </div>
            ) : null}
            {(draft.specifications ?? []).map((spec, index) => (
              <fieldset key={spec.id} className="collectionRow">
                <legend className="visuallyHidden">Характеристика {index + 1}</legend>
                <label>
                  <span className="collectionFieldName">Название характеристики</span>
                  <input
                    aria-label="Название характеристики"
                    placeholder="Например, Вес или Комплектация"
                    value={spec.label}
                    onChange={(event) => {
                      const nextSpecs = [...(draft.specifications ?? [])];
                      nextSpecs[index] = { ...nextSpecs[index], label: event.target.value };
                      patch({ specifications: nextSpecs });
                    }}
                  />
                </label>
                <label>
                  <span className="collectionFieldName">Значение</span>
                  <input
                    aria-label="Значение характеристики"
                    placeholder="Например, 1.2 кг"
                    value={spec.value}
                    onChange={(event) => {
                      const nextSpecs = [...(draft.specifications ?? [])];
                      nextSpecs[index] = { ...nextSpecs[index], value: event.target.value };
                      patch({ specifications: nextSpecs });
                    }}
                  />
                </label>
                <div className="collectionRowActions">
                  <button
                    type="button"
                    className="collectionRemove"
                    aria-label={`Убрать характеристику ${index + 1}`}
                    title="Убрать характеристику"
                    onClick={() =>
                      patch({
                        specifications: (draft.specifications ?? []).filter((item) => item.id !== spec.id),
                      })
                    }
                  >
                    ✕
                  </button>
                </div>
              </fieldset>
            ))}
            <button
              type="button"
              className="collectionAdd"
              onClick={() =>
                patch({
                  specifications: [
                    ...(draft.specifications ?? []),
                    { id: crypto.randomUUID(), label: "", value: "" },
                  ],
                })
              }
            >
              Добавить характеристику
            </button>
          </div>
        </div>
      </section>
      <section className={styles.section}>
        <h2>Варианты</h2>
        <div className={styles.variantCollection}>
          {draft.variants.map((variant, index) => (
            <fieldset key={variant.id} className={styles.variantRow}>
              <legend className="visuallyHidden">Вариант {index + 1}</legend>
              <label className={styles.field}>
                <span className={styles.variantFieldName}>Размер</span>
                <input
                  value={variant.size}
                  onChange={(event) => patchVariant(index, { size: event.target.value })}
                />
              </label>
              <label className={styles.field}>
                <span className={styles.variantFieldName}>Комплектация</span>
                <input
                  aria-label="Комплектация"
                  value={variant.configuration ?? ""}
                  onChange={(event) => patchVariant(index, { configuration: event.target.value })}
                />
              </label>
              <label className={styles.field}>
                <span className={styles.variantFieldName}>Цвет</span>
                <input
                  value={variant.color}
                  onChange={(event) => patchVariant(index, { color: event.target.value })}
                />
              </label>
              <label className={styles.field}>
                <span className={styles.variantFieldName}>SKU</span>
                <input value={variant.sku} onChange={(event) => patchVariant(index, { sku: event.target.value })} />
                {variant.sku.trim() && draft.variants.some((item, i) => i !== index && item.sku.trim().toLowerCase() === variant.sku.trim().toLowerCase()) ? (
                  <span className="fieldError">Артикул (SKU) повторяется</span>
                ) : !variant.sku.trim() ? (
                  <span className="fieldHint">Заполните для публикации</span>
                ) : null}
              </label>
              <label className={styles.field}>
                <span className={styles.variantFieldName}>Цена</span>
                <input
                  type="number"
                  value={variant.price ?? ""}
                  onChange={(event) => patchVariant(index, { price: optionalNumber(event.target.value) })}
                />
              </label>
              <label className={styles.field}>
                <span className={styles.variantFieldName}>Цена до скидки варианта {index + 1}</span>
                <input
                  aria-label={`Цена до скидки варианта ${index + 1}`}
                  type="number"
                  min="0"
                  value={variant.oldPrice ?? ""}
                  onChange={(event) => patchVariant(index, { oldPrice: optionalNumber(event.target.value) })}
                />
              </label>
              <label className={styles.check}>
                <input
                  type="checkbox"
                  checked={variant.priceOnRequest}
                  onChange={(event) => patchVariant(index, { priceOnRequest: event.target.checked })}
                />
                <span className={styles.variantFieldName}>Цена по запросу</span>
              </label>
              <div className={styles.variantImage}>
                <PlacementFields
                  value={variant.image}
                  onChange={(image) => patchVariant(index, { image })}
                  label={`Фото варианта ${index + 1}`}
                />
              </div>
              <div className={styles.variantActions}>
                <button
                  type="button"
                  className="collectionRemove"
                  aria-label={`Убрать вариант ${index + 1}`}
                  title="Убрать вариант"
                  onClick={() => patch({ variants: draft.variants.filter((item) => item.id !== variant.id) })}
                >
                  ✕
                </button>
              </div>
            </fieldset>
          ))}
          <button type="button" className="collectionAdd" onClick={() => patch({ variants: [...draft.variants, emptyVariant()] })}>
            Добавить вариант
          </button>
        </div>
      </section>
      <section className={styles.section}>
        <h2>Фото</h2>
        <ProductPhotoFields
          cover={draft.mainImage}
          gallery={draft.gallery}
          onCoverChange={(mainImage) => patch({ mainImage })}
          onGalleryChange={(gallery) => patch({ gallery })}
        />
      </section>
      <section className={styles.section}>
        <h2>Для поиска</h2>
        <label className={styles.field}>
          Заголовок в поиске
          <input
            value={draft.seoTitle ?? ""}
            placeholder={draft.name || "По умолчанию — название товара"}
            onChange={(event) => patch({ seoTitle: event.target.value })}
          />
        </label>
        <label className={styles.field}>
          Описание в поиске
          <textarea
            value={draft.seoDescription ?? ""}
            placeholder={draft.descriptionShort || "По умолчанию — короткое описание товара"}
            onChange={(event) => patch({ seoDescription: event.target.value })}
          />
        </label>
      </section>
      <DocumentReviewFooter
        entityType="shop-product"
        entityId={id}
        dirty={dirty}
        saving={saving}
        message={message}
        blockers={savedBlockers.map((code) => BLOCKER_TEXT[code] ?? { text: code })}
        extraFeedback={
          parentPublicationBlocked ? (
            <p role="status">
              Категория «{selectedCategory?.draft.name ?? "товара"}» не опубликована. Сначала опубликуйте ее в{" "}
              <Link href={`/shop/category-editor?id=${encodeURIComponent(product.categoryId)}`}>настройках категории</Link>.
            </p>
          ) : null
        }
        lastSavedBy={record.lastSavedBy}
        lastPublishedBy={record.lastPublishedBy}
        onSave={onSave}
        adminActions={
          <>
            <button
              type="button"
              disabled={dirty || publishing || savedBlockers.length > 0 || parentPublicationBlocked}
              onClick={() => void onPublish()}
            >
              {publishing ? "Публикуем…" : "Опубликовать"}
            </button>
            {record.publishedSnapshot != null ? (
              <button type="button" onClick={() => void onHide()}>
                Скрыть с сайта
              </button>
            ) : (
              <button type="button" onClick={() => void onDelete()}>
                Удалить
              </button>
            )}
          </>
        }
      />
      <CatalogCreateDialog
        dialogRef={subcategoryDialogRef}
        title={editingSubcategoryId ? "Переименовать подкатегорию" : "Новая подкатегория"}
        submitLabel={editingSubcategoryId ? "Сохранить" : "Создать"}
        nameLabel="Название подкатегории"
        name={subcategoryName}
        slug={subcategorySlug}
        context={`Категория: ${categories.find((category) => category.id === product.categoryId)?.draft.name ?? ""}`}
        onNameChange={(value) => {
          setSubcategoryName(value);
          if (!subcategorySlugTouched) setSubcategorySlug(slugifyTitle(value));
        }}
        onSlugChange={(value) => {
          setSubcategorySlugTouched(true);
          setSubcategorySlug(value);
        }}
        onCancel={() => subcategoryDialogRef.current?.close()}
        onSubmit={(event) => {
          event.preventDefault();
          void createSubcategory().catch((error) => setMessage(
            error instanceof AdminClientError && error.code === "slug_taken"
              ? "Подкатегория с таким названием или адресом уже есть в этой категории."
              : "Не удалось сохранить подкатегорию. Проверьте название и адрес.",
          ));
        }}
      />
      <dialog ref={subcategoryDeleteDialogRef} className={styles.subcategoryDeleteDialog} aria-labelledby="delete-subcategory-title">
        <h2 id="delete-subcategory-title">Удалить подкатегорию?</h2>
        <p>Удалится только значение фильтра. Если подкатегория назначена товарам, сначала смените её в карточках и сохраните изменения.</p>
        {subcategoryDeleteError ? <p className={styles.inlineNotice} role="alert">{subcategoryDeleteError}</p> : null}
        <div className={styles.subcategoryDialogActions}>
          <button type="button" className="ghost" onClick={() => subcategoryDeleteDialogRef.current?.close()}>Отмена</button>
          <button type="button" className={styles.subcategoryDelete} onClick={() => void deleteSelectedSubcategory()}>Удалить</button>
        </div>
      </dialog>
    </main>
  );
}
