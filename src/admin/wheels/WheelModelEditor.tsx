"use client";

import { useEffect, useState } from "react";

import { browserAdminClient } from "@/admin/client/localStore";
import { AdminClientError } from "@/admin/client/errors";
import { wheelModelPublishBlockers } from "@/admin/domain/publishRules";
import type {
  AdminRole,
  DocumentLink,
  EntityRecord,
  WheelModelDraft,
  WheelTypeDraft,
  WheelVariantDraft,
} from "@/admin/domain/types";
import { PlacementFields } from "@/admin/media/PlacementFields";

import styles from "./WheelDocument.module.css";

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
  direction: "Выберите тип диска",
  mainImage: "Добавьте главное фото",
  size: "Укажите читаемый размер",
  price: "Укажите цену или «по запросу»",
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

function readFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export function WheelModelEditor({ id }: { id: string }) {
  const [record, setRecord] = useState<EntityRecord<WheelModelDraft> | null>(null);
  const [draft, setDraft] = useState<WheelModelDraft | null>(null);
  const [types, setTypes] = useState<EntityRecord<WheelTypeDraft>[]>([]);
  const [role, setRole] = useState<AdminRole>("admin");
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
  }, [id]);

  if (draft == null || record == null) return <main className={styles.page}>Загрузка…</main>;
  const model = draft;
  const stored = record;

  const dirty = JSON.stringify(model) !== JSON.stringify(stored.savedDraft) || stored.savedDraft == null;
  const blockers = wheelModelPublishBlockers(model);
  const savedBlockers = stored.savedDraft == null ? [] : wheelModelPublishBlockers(stored.savedDraft);

  function patch(next: Partial<WheelModelDraft>) {
    setDraft((current) => (current == null ? current : { ...current, ...next }));
  }

  function patchVariant(index: number, next: Partial<WheelVariantDraft>) {
    const variants = model.variants.slice();
    variants[index] = { ...variants[index], ...next };
    patch({ variants });
  }

  function moveGallery(index: number, delta: -1 | 1) {
    const target = index + delta;
    if (target < 0 || target >= model.gallery.length) return;
    const gallery = model.gallery.slice();
    const [item] = gallery.splice(index, 1);
    gallery.splice(target, 0, item);
    patch({ gallery });
  }

  async function onDocumentFile(file: File | undefined) {
    if (file == null) return;
    const dataUrl = await readFile(file);
    const asset = await browserAdminClient().createAsset({
      name: file.name,
      mimeType: file.type || "application/pdf",
      dataUrl,
    });
    const documents: DocumentLink[] = [...model.documents, { assetId: asset.id, title: file.name }];
    patch({ documents });
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
    <main className={styles.page}>
      <h1>{draft.name || "Модель диска"}</h1>
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
          Тип
          <select value={draft.wheelTypeId} onChange={(event) => patch({ wheelTypeId: event.target.value })}>
            {types.map((type) => (
              <option key={type.id} value={type.id}>
                {type.draft.name}
              </option>
            ))}
          </select>
        </label>
        <label className={styles.field}>
          Серия
          <input value={draft.series} onChange={(event) => patch({ series: event.target.value })} />
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
      <section className={styles.section}>
        <h2>PDF</h2>
        {draft.documents.map((doc, index) => (
          <div key={`${doc.assetId}-${index}`} className={styles.row}>
            <label className={styles.field}>
              Название PDF
              <input
                value={doc.title}
                onChange={(event) => {
                  const documents = draft.documents.slice();
                  documents[index] = { ...doc, title: event.target.value };
                  patch({ documents });
                }}
              />
            </label>
            <div className={styles.rowActions}>
              <button
                type="button"
                onClick={() => patch({ documents: draft.documents.filter((_, i) => i !== index) })}
              >
                Убрать
              </button>
            </div>
          </div>
        ))}
        <input
          aria-label="Загрузить PDF"
          type="file"
          accept="application/pdf"
          onChange={(event) => void onDocumentFile(event.target.files?.[0])}
        />
      </section>
      <div className={styles.actions}>
        <p>Сохранил: {record.lastSavedBy ?? "—"}</p>
        <p>Опубликовал: {record.lastPublishedBy ?? "—"}</p>
        {message ? <p>{message}</p> : null}
        {savedBlockers.map((code) => (
          <p key={code}>{BLOCKER_TEXT[code] ?? code}</p>
        ))}
        {blockers.length > 0 && dirty ? <p>Есть несохранённые правки</p> : null}
        <button type="button" disabled={saving} onClick={() => void onSave()}>
          {saving ? "Сохраняем…" : "Сохранить"}
        </button>
        {role === "admin" ? (
          <button
            type="button"
            disabled={dirty || publishing || savedBlockers.length > 0}
            onClick={() => void onPublish()}
          >
            {publishing ? "Публикуем…" : "Опубликовать"}
          </button>
        ) : null}
      </div>
    </main>
  );
}
