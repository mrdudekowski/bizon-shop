"use client";

import { BlockNav, useAdminRole } from "@/admin/ui/DocumentUI";
import { DocumentReviewFooter } from "@/admin/ui/DocumentReviewFooter";
import { AdminLoading } from "@/admin/ui/AdminLoading";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { browserAdminClient } from "@/admin/client/localStore";
import { DOCUMENT_STATUS, actionErrorText } from "@/admin/client/actionFeedback";
import { wheelModelPublishBlockers } from "@/admin/domain/publishRules";
import type {
  EntityRecord,
  WheelModelDraft,
  WheelTypeDraft,
  WheelVariantDraft,
} from "@/admin/domain/types";
import { ProductPhotoFields } from "@/admin/media/PlacementFields";
import type { PublishBlockerHint } from "@/admin/ui/documentTabs";

import styles from "./WheelDocument.module.css";

const BLOCKER_TEXT: Record<string, PublishBlockerHint> = {
  name: { text: "Укажите название", tab: "Карточка", field: "Название" },
  slug: { text: "Укажите адрес страницы", tab: "Карточка", field: "Адрес" },
  direction: { text: "Не найдена служебная категория дисков" },
  mainImage: { text: "Добавьте главное фото", tab: "Фото", anchor: "main" },
  size: { text: "Укажите читаемый размер", tab: "Варианты", field: "Размер" },
  price: { text: "Укажите цену или «по запросу»", tab: "Варианты", field: "Цена" },
  duplicateSize: { text: "Размер повторяется", tab: "Варианты" },
};

const VARIANT_COLUMNS = {
  "--collection-columns": "minmax(120px,1.4fr) minmax(100px,1fr) 104px 92px 84px 136px",
} as React.CSSProperties;

function optionalNumber(raw: string): number | undefined {
  if (raw === "") return undefined;
  const next = Number(raw);
  return Number.isFinite(next) ? next : undefined;
}

function emptyVariant(): WheelVariantDraft {
  return {
    id: crypto.randomUUID(),
    sizeLabel: "",
    pcd: "",
    color: "",
    priceOnRequest: true,
    available: true,
  };
}

export function WheelModelEditor({ id }: { id: string }) {
  const router = useRouter();
  const [record, setRecord] = useState<EntityRecord<WheelModelDraft> | null>(null);
  const [draft, setDraft] = useState<WheelModelDraft | null>(null);
  const [types, setTypes] = useState<EntityRecord<WheelTypeDraft>[]>([]);
  const [role, setRole] = useAdminRole();
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [message, setMessage] = useState("");
  const [expandedVariantId, setExpandedVariantId] = useState<string | null>(null);

  useEffect(() => {
    const client = browserAdminClient();
    void Promise.all([client.getWheelModel(id), client.listWheelTypes(), client.getSession()]).then(
      ([nextRecord, nextTypes, session]) => {
        setRecord(nextRecord);
        setDraft(nextRecord.draft);
        setTypes(nextTypes);
        setRole(session.role);
      },
    );
  }, [id, setRole]);

  if (draft == null || record == null) return <main className={styles.page}><AdminLoading /></main>;
  const model = draft;
  const stored = record;

  const dirty = JSON.stringify(model) !== JSON.stringify(stored.savedDraft) || stored.savedDraft == null;
  const saved = stored.savedDraft;
  const savedBlockers =
    saved == null
      ? []
      : wheelModelPublishBlockers(
          saved,
          types.some((type) => type.id === saved.wheelTypeId),
        );

  function patch(next: Partial<WheelModelDraft>) {
    setDraft((current) => (current == null ? current : { ...current, ...next }));
  }

  function patchVariant(index: number, next: Partial<WheelVariantDraft>) {
    const variants = model.variants.slice();
    variants[index] = { ...variants[index], ...next };
    patch({ variants });
  }


  async function onSave() {
    setSaving(true);
    setMessage("");
    try {
      const saved = await browserAdminClient().saveWheelModel(id, model);
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
      const published = await browserAdminClient().publishWheelModel(id);
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
      setRecord(await browserAdminClient().hideWheelModel(id));
      setMessage(DOCUMENT_STATUS.hidden);
    } catch (error) {
      setMessage(actionErrorText(error, "Не удалось скрыть"));
    }
  }

  async function onDelete() {
    try {
      await browserAdminClient().deleteWheelModel(id);
      router.push("/wheels");
    } catch (error) {
      setMessage(actionErrorText(error, "Не удалось удалить"));
    }
  }

  return (
    <main className="document" data-unsaved={dirty ? "true" : undefined}>
      <Link className="backLink" href="/wheels">← Назад к моделям дисков</Link>
      <h1>{draft.name || "Модель диска"}</h1>
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
          Серия
          <input value={draft.series} onChange={(event) => patch({ series: event.target.value })} />
        </label>
        <label className={styles.field}>
          Стиль
          <input value={draft.designStyle ?? ""} onChange={(event) => patch({ designStyle: event.target.value })} />
        </label>
        <label className={styles.field}>
          Материал
          <input value={draft.material} onChange={(event) => patch({ material: event.target.value })} />
        </label>
        <label className={styles.field}>
          Конструкция
          <input
            value={draft.constructionMethod}
            onChange={(event) => patch({ constructionMethod: event.target.value })}
          />
        </label>
        <label className={styles.field}>
          Посадка
          <input value={draft.fitmentNotes} onChange={(event) => patch({ fitmentNotes: event.target.value })} />
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
        <label className={styles.check}>
          <input
            type="checkbox"
            checked={draft.showInMenu}
            onChange={(event) => patch({ showInMenu: event.target.checked })}
          />
          Показывать в меню
        </label>
        <label className={styles.field}>
          Порядок в меню
          <input
            type="number"
            value={draft.menuOrder}
            onChange={(event) => patch({ menuOrder: Number(event.target.value) || 0 })}
          />
        </label>
      </section>
      <section className={styles.section}>
        <h2>Варианты</h2>
        <div className="collection" style={VARIANT_COLUMNS}>
          {draft.variants.length > 0 ? (
            <div className="collectionHead" aria-hidden="true">
              <span>Размер</span>
              <span>Цвет</span>
              <span>Цена</span>
              <span>По запросу</span>
              <span>В наличии</span>
              <span />
            </div>
          ) : null}
          {draft.variants.map((variant, index) => (
            <fieldset key={variant.id} className="collectionRow">
              <legend className="visuallyHidden">Вариант {index + 1}</legend>
              <label>
                <span className="collectionFieldName">Размер</span>
                <input
                  value={variant.sizeLabel}
                  onChange={(event) => patchVariant(index, { sizeLabel: event.target.value })}
                />
              </label>
              <label>
                <span className="collectionFieldName">Цвет</span>
                <input
                  value={variant.color}
                  onChange={(event) => patchVariant(index, { color: event.target.value })}
                />
              </label>
              <label>
                <span className="collectionFieldName">Цена</span>
                <input
                  type="number"
                  value={variant.price ?? ""}
                  onChange={(event) => patchVariant(index, { price: optionalNumber(event.target.value) })}
                />
              </label>
              <label className="collectionCheck">
                <input
                  type="checkbox"
                  checked={variant.priceOnRequest}
                  onChange={(event) => patchVariant(index, { priceOnRequest: event.target.checked })}
                />
                <span className="collectionFieldName">Цена по запросу</span>
              </label>
              <label className="collectionCheck">
                <input
                  type="checkbox"
                  checked={variant.available}
                  onChange={(event) => patchVariant(index, { available: event.target.checked })}
                />
                <span className="collectionFieldName">В наличии</span>
              </label>
              <div className="collectionRowActions">
                <button
                  type="button"
                  className="collectionToggle"
                  aria-expanded={expandedVariantId === variant.id}
                  aria-controls={`variant-details-${variant.id}`}
                  title="Посадочные размеры"
                  onClick={() => setExpandedVariantId(expandedVariantId === variant.id ? null : variant.id)}
                >
                  {expandedVariantId === variant.id ? "Свернуть" : "Ещё"}
                </button>
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
              {expandedVariantId === variant.id ? (
                <div id={`variant-details-${variant.id}`} className="collectionExtraGrid">
                  <label>
                    PCD
                    <input value={variant.pcd} onChange={(event) => patchVariant(index, { pcd: event.target.value })} />
                  </label>
                  <label>
                    Вылет ET
                    <input
                      type="number"
                      value={variant.offsetET ?? ""}
                      onChange={(event) => patchVariant(index, { offsetET: optionalNumber(event.target.value) })}
                    />
                  </label>
                  <label>
                    Центральное отверстие
                    <input
                      type="number"
                      value={variant.centerBore ?? ""}
                      onChange={(event) => patchVariant(index, { centerBore: optionalNumber(event.target.value) })}
                    />
                  </label>
                </div>
              ) : null}
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
      <DocumentReviewFooter
        entityType="wheel-model"
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
    </main>
  );
}
