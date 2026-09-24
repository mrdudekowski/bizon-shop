"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { browserAdminClient } from "@/admin/client/localStore";
import { AdminClientError } from "@/admin/client/errors";
import {
  AXLE_OPTIONS,
  OPERATING_CONDITION_OPTIONS,
  TIRE_CATEGORIES,
  VEHICLE_TYPE_OPTIONS,
  type CatalogAxle,
  type OperatingCondition,
} from "@/admin/domain/options";
import { tireModelPublishBlockers } from "@/admin/domain/publishRules";
import type {
  AdminRole,
  AdvantageItem,
  DocumentLink,
  TireDirection,
  TireModelDraft,
  TireModelRecord,
  TireSizeDraft,
} from "@/admin/domain/types";
import { PlacementFields } from "@/admin/media/PlacementFields";

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
  direction: "Выберите направление",
  mainImage: "Добавьте главное фото",
  size: "Укажите читаемый размер",
  price: "Укажите цену или «по запросу»",
  duplicateSize: "Размер повторяется",
};

const SIZE_NUMBER_FIELDS: { key: keyof TireSizeDraft; label: string }[] = [
  { key: "rimDiameter", label: "Диаметр обода" },
  { key: "overallDiameter", label: "Внешний диаметр" },
  { key: "sectionWidth", label: "Ширина профиля" },
  { key: "treadDepth", label: "Глубина протектора" },
  { key: "pressureSingleKpa", label: "Давление single, кПа" },
  { key: "pressureDualKpa", label: "Давление dual, кПа" },
  { key: "maxLoadSingleKg", label: "Нагрузка single, кг" },
  { key: "maxLoadDualKg", label: "Нагрузка dual, кг" },
];

const SIZE_TEXT_FIELDS: { key: keyof TireSizeDraft; label: string }[] = [
  { key: "loadIndex", label: "Индекс нагрузки" },
  { key: "loadIndexDual", label: "Индекс нагрузки dual" },
  { key: "speedIndex", label: "Индекс скорости" },
  { key: "plyRating", label: "Слойность" },
  { key: "recommendedRim", label: "Рекомендуемый обод" },
];

function readFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function optionalNumber(raw: string): number | undefined {
  if (raw === "") return undefined;
  const next = Number(raw);
  return Number.isFinite(next) ? next : undefined;
}

function emptySize(): TireSizeDraft {
  return { id: crypto.randomUUID(), size: "", priceOnRequest: false, available: true };
}

function emptyAdvantage(): AdvantageItem {
  return { id: crypto.randomUUID(), title: "", description: "" };
}

export function TireModelEditor({ id }: { id: string }) {
  const router = useRouter();
  const [record, setRecord] = useState<TireModelRecord | null>(null);
  const [draft, setDraft] = useState<TireModelDraft | null>(null);
  const [directions, setDirections] = useState<TireDirection[]>([]);
  const [role, setRole] = useState<AdminRole>("admin");
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const client = browserAdminClient();
    void Promise.all([client.getTireModel(id), client.listTireDirections(), client.getSession()]).then(
      ([nextRecord, nextDirections, session]) => {
        setRecord(nextRecord);
        setDraft(nextRecord.draft);
        setDirections(nextDirections);
        setRole(session.role);
      },
    );
  }, [id]);

  if (draft == null || record == null) return <main>Загрузка…</main>;
  const model = draft;
  const stored = record;

  const dirty = JSON.stringify(model) !== JSON.stringify(stored.savedDraft) || stored.savedDraft == null;
  const blockers = tireModelPublishBlockers(model);
  const savedBlockers = stored.savedDraft == null ? [] : tireModelPublishBlockers(stored.savedDraft);

  function patch(next: Partial<TireModelDraft>) {
    setDraft((current) => (current == null ? current : { ...current, ...next }));
  }

  function patchSize(index: number, next: Partial<TireSizeDraft>) {
    const sizes = model.sizes.slice();
    sizes[index] = { ...sizes[index], ...next };
    patch({ sizes });
  }

  async function onSave() {
    setSaving(true);
    setMessage("");
    try {
      const saved = await browserAdminClient().saveTireModel(id, model);
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
      const published = await browserAdminClient().publishTireModel(id);
      setRecord(published);
      setDraft(published.draft);
    } catch (error) {
      setMessage(error instanceof AdminClientError ? ERROR_TEXT[error.code] : "Не удалось опубликовать");
    } finally {
      setPublishing(false);
    }
  }

  async function onHide() {
    const hidden = await browserAdminClient().hideTireModel(id);
    setRecord(hidden);
  }

  async function onDelete() {
    await browserAdminClient().deleteTireModel(id);
    router.push("/");
  }

  function toggle<T extends string>(list: T[], value: T): T[] {
    return list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
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

  return (
    <main>
      <h1>{draft.name || "Модель шины"}</h1>
      <section>
        <h2>Карточка</h2>
        <label>
          Название
          <input value={draft.name} onChange={(event) => patch({ name: event.target.value })} />
        </label>
        <label>
          Slug
          <input
            value={draft.slug}
            disabled={record.slugLocked}
            onChange={(event) => patch({ slug: event.target.value })}
          />
        </label>
        <label>
          Направление
          <select value={draft.directionId} onChange={(event) => patch({ directionId: event.target.value })}>
            {directions.map((direction) => (
              <option key={direction.id} value={direction.id}>
                {direction.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Бренд
          <input value={draft.brand} onChange={(event) => patch({ brand: event.target.value })} />
        </label>
        <label>
          Короткое описание
          <textarea value={draft.descriptionShort} onChange={(event) => patch({ descriptionShort: event.target.value })} />
        </label>
        <label>
          Полное описание
          <textarea value={draft.descriptionLong} onChange={(event) => patch({ descriptionLong: event.target.value })} />
        </label>
        <label>
          Категория применения
          <select
            value={draft.applicationCategory}
            onChange={(event) => patch({ applicationCategory: event.target.value as TireModelDraft["applicationCategory"] })}
          >
            <option value="">Не выбрана</option>
            {TIRE_CATEGORIES.map((category) => (
              <option key={category.value} value={category.value}>
                {category.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Тип протектора
          <input value={draft.treadType} onChange={(event) => patch({ treadType: event.target.value })} />
        </label>
        <label>
          <input
            type="checkbox"
            checked={draft.showInMenu}
            onChange={(event) => patch({ showInMenu: event.target.checked })}
          />
          Показывать в меню
        </label>
        <label>
          Порядок в меню
          <input
            type="number"
            value={draft.menuOrder}
            onChange={(event) => patch({ menuOrder: Number(event.target.value) || 0 })}
          />
        </label>
      </section>
      <section>
        <h2>Подбор</h2>
        {VEHICLE_TYPE_OPTIONS.map((option) => (
          <label key={option.value}>
            <input
              type="checkbox"
              checked={draft.selectionVehicleTypes.includes(option.value)}
              onChange={() => patch({ selectionVehicleTypes: toggle(draft.selectionVehicleTypes, option.value) })}
            />
            {option.label}
          </label>
        ))}
        {OPERATING_CONDITION_OPTIONS.map((option) => (
          <label key={option.value}>
            <input
              type="checkbox"
              checked={draft.selectionConditions.includes(option.value)}
              onChange={() =>
                patch({ selectionConditions: toggle<OperatingCondition>(draft.selectionConditions, option.value) })
              }
            />
            {option.label}
          </label>
        ))}
        {AXLE_OPTIONS.map((option) => (
          <label key={option.value}>
            <input
              type="checkbox"
              checked={draft.selectionAxles.includes(option.value)}
              onChange={() => patch({ selectionAxles: toggle<CatalogAxle>(draft.selectionAxles, option.value) })}
            />
            {option.label}
          </label>
        ))}
      </section>
      <section>
        <h2>Размеры</h2>
        {draft.sizes.map((size, index) => (
          <div key={size.id}>
            <input
              aria-label="Размер"
              value={size.size}
              onChange={(event) => patchSize(index, { size: event.target.value })}
            />
            <input
              aria-label="Цена"
              value={size.price ?? ""}
              onChange={(event) => patchSize(index, { price: optionalNumber(event.target.value) })}
            />
            <label>
              <input
                type="checkbox"
                checked={size.priceOnRequest}
                onChange={(event) => patchSize(index, { priceOnRequest: event.target.checked })}
              />
              по запросу
            </label>
            <label>
              <input
                type="checkbox"
                checked={size.available}
                onChange={(event) => patchSize(index, { available: event.target.checked })}
              />
              в наличии
            </label>
            <input
              aria-label="SKU"
              value={size.sku ?? ""}
              onChange={(event) => patchSize(index, { sku: event.target.value })}
            />
            {!(size.sku ?? "").trim() ? <span>SKU не заполнен</span> : null}
            {SIZE_TEXT_FIELDS.map((field) => (
              <label key={field.key}>
                {field.label}
                <input
                  value={(size[field.key] as string | undefined) ?? ""}
                  onChange={(event) => patchSize(index, { [field.key]: event.target.value } as Partial<TireSizeDraft>)}
                />
              </label>
            ))}
            {SIZE_NUMBER_FIELDS.map((field) => (
              <label key={field.key}>
                {field.label}
                <input
                  type="number"
                  value={(size[field.key] as number | undefined) ?? ""}
                  onChange={(event) =>
                    patchSize(index, { [field.key]: optionalNumber(event.target.value) } as Partial<TireSizeDraft>)
                  }
                />
              </label>
            ))}
            <button type="button" onClick={() => patch({ sizes: draft.sizes.filter((item) => item.id !== size.id) })}>
              Убрать
            </button>
          </div>
        ))}
        <button type="button" onClick={() => patch({ sizes: [...draft.sizes, emptySize()] })}>
          Добавить размер
        </button>
      </section>
      <section>
        <h2>Медиа</h2>
        <PlacementFields
          label="Главное фото"
          value={draft.mainImage}
          onChange={(mainImage) => patch({ mainImage })}
        />
        <h3>Галерея</h3>
        {draft.gallery.map((item, index) => (
          <div key={`${item.assetId}-${index}`}>
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
      <section>
        <h2>Преимущества</h2>
        {draft.advantages.map((item, index) => (
          <div key={item.id}>
            <input
              aria-label="Заголовок преимущества"
              value={item.title}
              onChange={(event) => {
                const advantages = draft.advantages.slice();
                advantages[index] = { ...item, title: event.target.value };
                patch({ advantages });
              }}
            />
            <textarea
              aria-label="Описание преимущества"
              value={item.description}
              onChange={(event) => {
                const advantages = draft.advantages.slice();
                advantages[index] = { ...item, description: event.target.value };
                patch({ advantages });
              }}
            />
            <button
              type="button"
              onClick={() => patch({ advantages: draft.advantages.filter((row) => row.id !== item.id) })}
            >
              Убрать
            </button>
          </div>
        ))}
        <button type="button" onClick={() => patch({ advantages: [...draft.advantages, emptyAdvantage()] })}>
          Добавить преимущество
        </button>
      </section>
      <section>
        <h2>PDF</h2>
        {draft.documents.map((doc, index) => (
          <div key={`${doc.assetId}-${index}`}>
            <input
              aria-label="Название PDF"
              value={doc.title}
              onChange={(event) => {
                const documents = draft.documents.slice();
                documents[index] = { ...doc, title: event.target.value };
                patch({ documents });
              }}
            />
            <button
              type="button"
              onClick={() => patch({ documents: draft.documents.filter((_, i) => i !== index) })}
            >
              Убрать
            </button>
          </div>
        ))}
        <input
          aria-label="Загрузить PDF"
          type="file"
          accept="application/pdf"
          onChange={(event) => void onDocumentFile(event.target.files?.[0])}
        />
      </section>
      <div>
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
              <button type="button" onClick={() => void onHide()}>
                Скрыть с сайта
              </button>
            ) : (
              <button type="button" onClick={() => void onDelete()}>
                Удалить
              </button>
            )}
          </>
        ) : null}
      </div>
    </main>
  );
}
