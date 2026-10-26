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
import { DocumentFields } from "@/admin/media/DocumentFields";
import type { PublishBlockerHint } from "@/admin/ui/documentTabs";

import styles from "./WheelDocument.module.css";

const BLOCKER_TEXT: Record<string, PublishBlockerHint> = {
  name: { text: "Укажите название", tab: "Карточка", field: "Название" },
  slug: { text: "Укажите адрес страницы", tab: "Карточка", field: "Адрес" },
  direction: { text: "Не найдена служебная категория дисков" },
  mainImage: { text: "Добавьте главное фото", tab: "Фото", anchor: "main" },
  size: { text: "Укажите читаемый размер", tab: "Характеристики", field: "Размер" },
  price: { text: "Укажите цену или «по запросу»", tab: "Характеристики", field: "Цена" },
  duplicateSize: { text: "Размер повторяется", tab: "Характеристики" },
  duplicateSku: { text: "Артикул (SKU) повторяется", tab: "Характеристики", field: "SKU" },
};

function summarizeWheelVariantSpecs(variant: WheelVariantDraft): { label: string; value: string }[] {
  const items: { label: string; value: string }[] = [];
  if (variant.sku) items.push({ label: "SKU", value: variant.sku });
  if (variant.diameter != null && variant.width != null) {
    items.push({ label: "Габариты", value: `${variant.diameter}×${variant.width}J` });
  }
  if (variant.pcd) items.push({ label: "PCD", value: variant.pcd });
  if (variant.offsetET != null) items.push({ label: "ET", value: `${variant.offsetET}` });
  if (variant.centerBore != null) items.push({ label: "DIA", value: `${variant.centerBore}` });
  if (variant.loadRating) items.push({ label: "Нагрузка", value: variant.loadRating });
  if (variant.weight != null) items.push({ label: "Вес", value: `${variant.weight} кг` });
  if (variant.finish) items.push({ label: "Покрытие", value: variant.finish });
  if (variant.compatibleTireSizes) items.push({ label: "Шины", value: variant.compatibleTireSizes });
  return items;
}

const VARIANT_COLUMNS = {
  "--collection-columns": "minmax(120px,1.4fr) minmax(100px,1fr) 104px 110px 136px",
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
            checked={Boolean(draft.available)}
            onChange={(event) => patch({ available: event.target.checked })}
          />
          В наличии
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
        <h2>Характеристики</h2>
        <div className="specsGroup">
          <div className="specsHeader">
            <h3>Паспортные характеристики диска</h3>
            <p className="subheading">Конструкция, материал, серия, стиль и условия посадки на ступицу.</p>
          </div>
          <div className="specsFieldsGrid">
            <label className={styles.field}>
              Отделка / серия
              <input value={draft.series} placeholder="Например, Satin Black / Machined Silver" onChange={(event) => patch({ series: event.target.value })} />
            </label>
            <label className={styles.field}>
              Стиль / назначение
              <input value={draft.designStyle ?? ""} placeholder="Off-road / Performance / Expedition" onChange={(event) => patch({ designStyle: event.target.value })} />
            </label>
            <label className={styles.field}>
              Материал / сплав
              <input value={draft.material} placeholder="Например, Алюминиевый сплав 6061-T6" onChange={(event) => patch({ material: event.target.value })} />
            </label>
            <label className={styles.field}>
              Конструкция
              <select
                value={draft.constructionMethod || "forged"}
                onChange={(event) => patch({ constructionMethod: event.target.value })}
              >
                <option value="forged">Кованый (Forged)</option>
                <option value="flow_formed">Flow-formed (раскатной)</option>
                <option value="cast">Литой (Cast)</option>
                <option value="steel">Стальной</option>
                <option value="other">Другое</option>
              </select>
            </label>
          </div>
          <label className={styles.field}>
            Посадка
            <input value={draft.fitmentNotes} placeholder="Примечания по сверловке, ступице и совместимости" onChange={(event) => patch({ fitmentNotes: event.target.value })} />
          </label>
        </div>

        <div className="specsGroup">
          <div className="specsHeader">
            <h3>Типоразмеры и параметры дисков ({draft.variants.length})</h3>
            <p className="subheading">Параметры синхронизированы с таблицей характеристик и фильтрами каталога дисков.</p>
          </div>
          <div className="collection" style={VARIANT_COLUMNS}>
            {draft.variants.length > 0 ? (
              <div className="collectionHead" aria-hidden="true">
                <span>Размер</span>
                <span>Цвет</span>
                <span>Цена</span>
                <span>По запросу</span>
                <span />
              </div>
            ) : null}
            {draft.variants.map((variant, index) => {
              const summaryItems = summarizeWheelVariantSpecs(variant);
              const isExpanded = expandedVariantId === variant.id;
              const normalizedSize = variant.sizeLabel.trim().toLowerCase();
              const normalizedSku = (variant.sku ?? "").trim().toLowerCase();
              const hasDuplicateSize = normalizedSize.length > 0 && draft.variants.some(
                (item, i) => i !== index && item.sizeLabel.trim().toLowerCase() === normalizedSize,
              );
              const hasDuplicateSku = normalizedSku.length > 0 && draft.variants.some(
                (item, i) => i !== index && (item.sku ?? "").trim().toLowerCase() === normalizedSku,
              );
              return (
                <fieldset key={variant.id} className="collectionRow">
                  <legend className="visuallyHidden">Вариант {index + 1}</legend>
                  <label>
                    <span className="collectionFieldName">Размер</span>
                    <input
                      value={variant.sizeLabel}
                      onChange={(event) => patchVariant(index, { sizeLabel: event.target.value })}
                    />
                    {hasDuplicateSize ? <span className="fieldError">Размер повторяется</span> : null}
                    {hasDuplicateSku && !isExpanded ? <span className="fieldError">Дубликат SKU: {variant.sku}</span> : null}
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
                  <div className="collectionRowActions">
                    <button
                      type="button"
                      className="collectionToggle"
                      aria-expanded={isExpanded}
                      aria-controls={`variant-details-${variant.id}`}
                      title="Посадочные размеры"
                      onClick={() => setExpandedVariantId(isExpanded ? null : variant.id)}
                    >
                      {isExpanded ? "Свернуть" : "Ещё"}
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
                  {!isExpanded && summaryItems.length > 0 ? (
                    <div
                      className="specsSummaryBar"
                      role="button"
                      tabIndex={0}
                      onClick={() => setExpandedVariantId(variant.id)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          setExpandedVariantId(variant.id);
                        }
                      }}
                    >
                      {summaryItems.map((item) => (
                        <span key={item.label} className="specsChip">
                          <strong>{item.label}:</strong> {item.value}
                        </span>
                      ))}
                      <span className="specsEditCue">Изменить параметры →</span>
                    </div>
                  ) : null}
                  {isExpanded ? (
                    <div id={`variant-details-${variant.id}`} className="collectionExtraGrid">
                      <label>
                        SKU
                        <input value={variant.sku ?? ""} onChange={(event) => patchVariant(index, { sku: event.target.value })} />
                        {hasDuplicateSku ? <span className="fieldError">Артикул (SKU) уже используется</span> : null}
                      </label>
                      <label>
                        Диаметр
                        <input type="number" min="0" step="any" value={variant.diameter ?? ""} onChange={(event) => patchVariant(index, { diameter: optionalNumber(event.target.value) })} />
                      </label>
                      <label>
                        Ширина
                        <input type="number" min="0" step="any" value={variant.width ?? ""} onChange={(event) => patchVariant(index, { width: optionalNumber(event.target.value) })} />
                      </label>
                      <label>
                        Количество отверстий
                        <input type="number" min="0" step="1" value={variant.boltHoles ?? ""} onChange={(event) => patchVariant(index, { boltHoles: optionalNumber(event.target.value) })} />
                      </label>
                      <label>
                        PCD
                        <input value={variant.pcd} onChange={(event) => patchVariant(index, { pcd: event.target.value })} />
                      </label>
                      <label>
                        PCD, мм
                        <input type="number" min="0" step="any" value={variant.pcdMm ?? ""} onChange={(event) => patchVariant(index, { pcdMm: optionalNumber(event.target.value) })} />
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
                          step="any"
                          value={variant.centerBore ?? ""}
                          onChange={(event) => patchVariant(index, { centerBore: optionalNumber(event.target.value) })}
                        />
                      </label>
                      <label>
                        Допустимая нагрузка
                        <input value={variant.loadRating ?? ""} onChange={(event) => patchVariant(index, { loadRating: event.target.value })} />
                      </label>
                      <label>
                        Вес, кг
                        <input type="number" min="0" step="any" value={variant.weight ?? ""} onChange={(event) => patchVariant(index, { weight: optionalNumber(event.target.value) })} />
                      </label>
                      <label>
                        Покрытие
                        <input value={variant.finish ?? ""} onChange={(event) => patchVariant(index, { finish: event.target.value })} />
                      </label>
                      <label>
                        Тип крепежа
                        <input value={variant.fastenerType ?? ""} onChange={(event) => patchVariant(index, { fastenerType: event.target.value })} />
                      </label>
                      <label>
                        Материал крепежа
                        <input value={variant.fastenerMaterial ?? ""} onChange={(event) => patchVariant(index, { fastenerMaterial: event.target.value })} />
                      </label>
                      <label>
                        Совместимые размеры шин
                        <input value={variant.compatibleTireSizes ?? ""} onChange={(event) => patchVariant(index, { compatibleTireSizes: event.target.value })} />
                      </label>
                      <label>
                        Источник спецификации
                        <textarea value={variant.sourceSpecification ?? ""} onChange={(event) => patchVariant(index, { sourceSpecification: event.target.value })} />
                      </label>
                    </div>
                  ) : null}
                </fieldset>
              );
            })}
            <button type="button" className="collectionAdd" onClick={() => patch({ variants: [...draft.variants, emptyVariant()] })}>
              Добавить вариант
            </button>
          </div>
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
      <DocumentFields value={draft.documents} onChange={(documents) => patch({ documents })} />
      <section className={styles.section}>
        <h2>Для поиска</h2>
        <label className={styles.field}>
          Заголовок в поиске
          <input
            value={draft.seoTitle ?? ""}
            placeholder={draft.name || "По умолчанию — название модели"}
            onChange={(event) => patch({ seoTitle: event.target.value })}
          />
        </label>
        <label className={styles.field}>
          Описание в поиске
          <textarea
            value={draft.seoDescription ?? ""}
            placeholder={draft.descriptionShort || "По умолчанию — короткое описание модели"}
            onChange={(event) => patch({ seoDescription: event.target.value })}
          />
        </label>
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
