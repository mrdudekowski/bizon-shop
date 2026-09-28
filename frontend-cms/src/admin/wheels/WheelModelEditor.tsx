"use client";

import { BlockNav, useAdminRole } from "@/admin/ui/DocumentUI";
import { DocumentReviewFooter } from "@/admin/ui/DocumentReviewFooter";
import { AdminLoading } from "@/admin/ui/AdminLoading";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { browserAdminClient } from "@/admin/client/localStore";
import { AdminClientError } from "@/admin/client/errors";
import { ERROR_TEXT } from "@/admin/client/errorText";
import { wheelModelPublishBlockers } from "@/admin/domain/publishRules";
import type {
  EntityRecord,
  WheelModelDraft,
  WheelTypeDraft,
  WheelVariantDraft,
} from "@/admin/domain/types";
import { ProductPhotoFields } from "@/admin/media/PlacementFields";

import styles from "./WheelDocument.module.css";

const BLOCKER_TEXT: Record<string, string> = {
  name: "Укажите название",
  slug: "Укажите адрес страницы",
  direction: "Не найдена служебная категория дисков",
  mainImage: "Добавьте главное фото",
  size: "Укажите читаемый размер",
  price: "Укажите цену или «по запросу»",
  duplicateSize: "Размер повторяется",
};

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
      const published = await browserAdminClient().publishWheelModel(id);
      setRecord(published);
      setDraft(published.draft);
    } catch (error) {
      setMessage(error instanceof AdminClientError ? ERROR_TEXT[error.code] : "Не удалось опубликовать");
    } finally {
      setPublishing(false);
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
        {draft.variants.map((variant, index) => (
          <div key={variant.id} className={styles.row}>
            <label className={styles.field}>
              Размер
              <input
                value={variant.sizeLabel}
                onChange={(event) => patchVariant(index, { sizeLabel: event.target.value })}
              />
            </label>
            <label className={styles.field}>
              PCD
              <input value={variant.pcd} onChange={(event) => patchVariant(index, { pcd: event.target.value })} />
            </label>
            <label className={styles.field}>
              Вылет ET
              <input
                type="number"
                value={variant.offsetET ?? ""}
                onChange={(event) => patchVariant(index, { offsetET: optionalNumber(event.target.value) })}
              />
            </label>
            <label className={styles.field}>
              Центральное отверстие
              <input
                type="number"
                value={variant.centerBore ?? ""}
                onChange={(event) => patchVariant(index, { centerBore: optionalNumber(event.target.value) })}
              />
            </label>
            <label className={styles.field}>
              Цвет
              <input
                value={variant.color}
                onChange={(event) => patchVariant(index, { color: event.target.value })}
              />
            </label>
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
        blockers={savedBlockers.map((code) => BLOCKER_TEXT[code] ?? code)}
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
              <button type="button" onClick={() => void browserAdminClient().hideWheelModel(id).then(setRecord)}>
                Скрыть с сайта
              </button>
            ) : (
              <button
                type="button"
                onClick={() => void browserAdminClient().deleteWheelModel(id).then(() => router.push("/wheels"))}
              >
                Удалить
              </button>
            )}
          </>
        }
      />
    </main>
  );
}
