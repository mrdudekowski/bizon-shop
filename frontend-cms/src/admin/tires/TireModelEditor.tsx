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
import {
  AXLE_OPTIONS,
  OPERATING_CONDITION_OPTIONS,
  TIRE_ADVANTAGE_OPTIONS,
  TIRE_CATEGORIES,
  VEHICLE_TYPE_OPTIONS,
  type CatalogAxle,
  type OperatingCondition,
} from "@/admin/domain/options";
import { tireModelPublishBlockers } from "@/admin/domain/publishRules";
import type {
  TireDirection,
  TireModelDraft,
  TireModelRecord,
  TireSizeDraft,
} from "@/admin/domain/types";
import { ProductPhotoFields } from "@/admin/media/PlacementFields";

const BLOCKER_TEXT: Record<string, string> = {
  name: "Укажите название",
  slug: "Укажите адрес страницы",
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

function optionalNumber(raw: string): number | undefined {
  if (raw === "") return undefined;
  const next = Number(raw);
  return Number.isFinite(next) ? next : undefined;
}

function emptySize(): TireSizeDraft {
  return { id: crypto.randomUUID(), size: "", priceOnRequest: false, available: true };
}

type TireFeature = NonNullable<TireModelDraft["features"]>[number];

const LISTED_PROPERTIES = /\s*Основные заявленные свойства:[^."]*(?:\.[^"]*)?/;

function withoutListedProperties(text: string): string {
  return text.replace(LISTED_PROPERTIES, "").replace(/[ \t]{2,}/g, " ").trim();
}

function featuresForEditor(draft: TireModelDraft): TireFeature[] {
  const byKey = new Map<string, TireFeature>();
  for (const feature of draft.features ?? []) {
    if (!feature.key || byKey.has(feature.key)) continue;
    byKey.set(feature.key, feature);
  }
  for (const item of draft.advantages) {
    const option = TIRE_ADVANTAGE_OPTIONS.find((entry) => entry.label === item.title.trim());
    if (option == null || byKey.has(option.value)) continue;
    byKey.set(option.value, {
      id: `model-feature-${option.value}-${item.id}`,
      key: option.value,
      title: item.title,
      description: item.description,
    });
  }
  const known = TIRE_ADVANTAGE_OPTIONS.flatMap((option) => {
    const feature = byKey.get(option.value);
    return feature == null ? [] : [feature];
  });
  const extra = [...byKey.values()].filter(
    (feature) => !TIRE_ADVANTAGE_OPTIONS.some((option) => option.value === feature.key),
  );
  return [...known, ...extra];
}

function editorDraft(draft: TireModelDraft): TireModelDraft {
  return {
    ...draft,
    descriptionShort: withoutListedProperties(draft.descriptionShort),
    descriptionLong: withoutListedProperties(draft.descriptionLong),
    features: featuresForEditor(draft),
    advantages: [],
  };
}

function setFeature(
  draft: TireModelDraft,
  option: (typeof TIRE_ADVANTAGE_OPTIONS)[number],
  next: { checked: boolean; title?: string; description?: string },
): Pick<TireModelDraft, "features" | "advantages"> {
  const current = (draft.features ?? []).find((feature) => feature.key === option.value);
  const rest = (draft.features ?? []).filter((feature) => feature.key !== option.value);
  if (!next.checked) return { features: rest, advantages: [] };
  const feature: TireFeature = {
    id: current?.id ?? `model-feature-${option.value}-${crypto.randomUUID()}`,
    key: option.value,
    title: next.title ?? current?.title ?? option.label,
    description: next.description ?? current?.description ?? "",
  };
  const ordered = TIRE_ADVANTAGE_OPTIONS.flatMap((entry) => {
    if (entry.value === option.value) return [feature];
    const existing = rest.find((item) => item.key === entry.value);
    return existing == null ? [] : [existing];
  });
  return { features: ordered, advantages: [] };
}

export function TireModelEditor({ id }: { id: string }) {
  const router = useRouter();
  const [record, setRecord] = useState<TireModelRecord | null>(null);
  const [draft, setDraft] = useState<TireModelDraft | null>(null);
  const [directions, setDirections] = useState<TireDirection[]>([]);
  const [role, setRole] = useAdminRole();
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const client = browserAdminClient();
    void Promise.all([client.getTireModel(id), client.listTireDirections(), client.getSession()]).then(
      ([nextRecord, nextDirections, session]) => {
        setRecord(nextRecord);
        setDraft(editorDraft(nextRecord.draft));
        setDirections(nextDirections);
        setRole(session.role);
      },
    );
  }, [id, setRole]);

  if (draft == null || record == null) return <main><AdminLoading /></main>;
  const model = draft;
  const stored = record;

  const dirty =
    stored.savedDraft == null || JSON.stringify(model) !== JSON.stringify(editorDraft(stored.savedDraft));
  const saved = stored.savedDraft;
  const savedBlockers =
    saved == null
      ? []
      : tireModelPublishBlockers(
          saved,
          directions.some((direction) => direction.id === saved.directionId),
        );

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


  return (
    <main className="document" data-unsaved={dirty ? "true" : undefined}>
      <Link className="backLink" href={`/?direction=${encodeURIComponent(draft.directionId)}`}>← Назад к моделям</Link>
      <h1>{draft.name || "Модель шины"}</h1>
      <BlockNav />
      <section>
        <h2>Карточка</h2>
        <label>
          Название
          <input value={draft.name} onChange={(event) => patch({ name: event.target.value })} />
        </label>
        <label>
          Код модели
          <input value={draft.modelCode ?? ""} onChange={(event) => patch({ modelCode: event.target.value })} />
        </label>
        <label>
          Адрес
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
          Тип протектора
          <input value={draft.treadType} onChange={(event) => patch({ treadType: event.target.value })} />
        </label>
        <fieldset className="choiceGroup">
          <legend>Применение шины</legend>
          <p>Выберите все подходящие условия. Эти отметки управляют фильтрами каталога на сайте.</p>
          {TIRE_CATEGORIES.map((category) => (
            <label key={category.value}>
              <input
                type="checkbox"
                checked={(draft.applicationTypes ?? []).includes(category.value)}
                onChange={() => patch({ applicationTypes: toggle(draft.applicationTypes ?? [], category.value) })}
              />
              {category.name}
            </label>
          ))}
          {(draft.applicationTypes ?? []).filter((value) => !TIRE_CATEGORIES.some((category) => category.value === value)).map((value) => (
            <label key={value}>
              <input
                type="checkbox"
                checked
                onChange={() => patch({ applicationTypes: (draft.applicationTypes ?? []).filter((item) => item !== value) })}
              />
              {value} <span>(старое значение)</span>
            </label>
          ))}
        </fieldset>
      </section>
      <section>
        <h2>Подбор</h2>
        <p>Направление — запасной совет, если ни одна модель не подошла. Галочки модели задают саму модель.</p>
        <fieldset className="choiceGroup">
          <legend>Тип техники</legend>
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
        </fieldset>
        <fieldset className="choiceGroup">
          <legend>Условия эксплуатации</legend>
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
        </fieldset>
        <fieldset className="choiceGroup">
          <legend>Оси</legend>
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
        </fieldset>
      </section>
      <section>
        <h2>Размеры</h2>
        {draft.sizes.map((size, index) => (
          <fieldset key={size.id} className="tireSize">
            <legend>Размер {index + 1}</legend>
            <label>
              Типоразмер
              <input
                aria-label="Размер"
                value={size.size}
                onChange={(event) => patchSize(index, { size: event.target.value })}
              />
            </label>
            <label>
              Цена
              <input
                aria-label="Цена"
                value={size.price ?? ""}
                onChange={(event) => patchSize(index, { price: optionalNumber(event.target.value) })}
              />
            </label>
            <label>
              <input
                type="checkbox"
                checked={size.priceOnRequest}
                onChange={(event) => patchSize(index, { priceOnRequest: event.target.checked })}
              />
              Цена по запросу
            </label>
            <label>
              <input
                type="checkbox"
                checked={size.available}
                onChange={(event) => patchSize(index, { available: event.target.checked })}
              />
              В наличии
            </label>
            <label>
              Артикул (SKU)
              <input
                aria-label="SKU"
                value={size.sku ?? ""}
                onChange={(event) => patchSize(index, { sku: event.target.value })}
              />
              {!(size.sku ?? "").trim() ? <span className="fieldHint">Для публикации заполните артикул.</span> : null}
            </label>
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
            <button type="button" aria-label={`Убрать размер ${index + 1}`} onClick={() => patch({ sizes: draft.sizes.filter((item) => item.id !== size.id) })}>
              Убрать размер
            </button>
          </fieldset>
        ))}
        <button type="button" onClick={() => patch({ sizes: [...draft.sizes, emptySize()] })}>
          Добавить размер
        </button>
      </section>
      <section>
        <h2>Фото</h2>
        <ProductPhotoFields
          cover={draft.mainImage}
          gallery={draft.gallery}
          onCoverChange={(mainImage) => patch({ mainImage })}
          onGalleryChange={(gallery) => patch({ gallery })}
        />
        </section>
      <section>
        <h2>Преимущества</h2>
        <p>Отмеченные пункты попадают в карусель на странице модели. Заголовок и текст можно поправить.</p>
        <div className="advantageList">
          {TIRE_ADVANTAGE_OPTIONS.map((option) => {
            const feature = (draft.features ?? []).find((item) => item.key === option.value);
            return (
              <div key={option.value} className="advantageItem">
                <label className="advantageChoice">
                  <img src={`/images/catalog/features/${option.value}.png`} alt="" width={40} height={40} />
                  <input
                    type="checkbox"
                    checked={feature != null}
                    onChange={(event) => patch(setFeature(draft, option, { checked: event.target.checked }))}
                  />
                  {option.label}
                </label>
                {feature != null ? (
                  <>
                    <label>
                      Заголовок
                      <input
                        value={feature.title}
                        onChange={(event) =>
                          patch(setFeature(draft, option, { checked: true, title: event.target.value }))
                        }
                      />
                    </label>
                    <label>
                      Текст
                      <textarea
                        value={feature.description}
                        onChange={(event) =>
                          patch(setFeature(draft, option, { checked: true, description: event.target.value }))
                        }
                      />
                    </label>
                  </>
                ) : null}
              </div>
            );
          })}
        </div>
      </section>
      <section>
        <h2>Меню</h2>
        <label><input type="checkbox" checked={draft.showInMenu} onChange={(event) => patch({ showInMenu: event.target.checked })} />Показывать в меню</label>
        <label>Порядок в меню<input type="number" value={draft.menuOrder} onChange={(event) => patch({ menuOrder: Number(event.target.value) || 0 })} /></label>
      </section>
      <DocumentReviewFooter
        entityType="tire-model"
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
