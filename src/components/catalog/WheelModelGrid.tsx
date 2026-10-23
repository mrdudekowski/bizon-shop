"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { CatalogCard } from "@/components/catalog/CatalogCard";
import { MobileFilterSheet } from "@/components/catalog/MobileFilterSheet";
import type { CmsWheelModel, CmsWheelVariant } from "@/lib/content/types";
import {
  filterWheelModels,
  formatWheelModelCount,
  getWheelFilterOptions,
  parseWheelFilters,
  type WheelFilters,
} from "@/lib/catalog/wheelFilters";

import styles from "./TireCatalog.module.css";

type WheelModelGridProps = {
  models: CmsWheelModel[];
  variants: CmsWheelVariant[];
  typeBasePath: string;
};

const FILTER_FIELDS = [
  { key: "designStyle", label: "Стиль", empty: "Любой стиль" },
  { key: "series", label: "Серия / исполнение", empty: "Любое исполнение" },
  { key: "diameter", label: "Диаметр", empty: "Все диаметры" },
  { key: "width", label: "Ширина", empty: "Любая ширина" },
  { key: "pcd", label: "PCD", empty: "Любая разболтовка" },
  { key: "offsetET", label: "ET", empty: "Любой вылет" },
  { key: "centerBore", label: "DIA", empty: "Любой DIA" },
  { key: "color", label: "Цвет", empty: "Любой цвет" },
] as const;

export function WheelModelGrid({
  models,
  variants,
  typeBasePath,
}: WheelModelGridProps) {
  const [filters, setFilters] = useState<WheelFilters>({});
  const options = getWheelFilterOptions(models, variants);
  const visibleModels = filterWheelModels(models, variants, filters);
  const hasFilters = FILTER_FIELDS.some(({ key }) => options[key].length > 0)
    || options.priceOnRequest.length > 0;
  const activeFilterCount = Object.values(filters).filter(Boolean).length;

  useEffect(() => {
    setFilters(parseWheelFilters(new URLSearchParams(window.location.search), models, variants));
  }, [models, variants]);

  function setFilter(key: keyof WheelFilters, value: string) {
    setFilters((current) => ({ ...current, [key]: value || undefined }));
  }

  function renderFields() {
    return (
      <>
        {FILTER_FIELDS.map(({ key, label, empty }) => options[key].length > 0 ? (
          <label className={styles.field} key={key}>
            <span>{label}</span>
            <select name={key} value={filters[key] ?? ""} onChange={(event) => setFilter(key, event.target.value)}>
              <option value="">{empty}</option>
              {options[key].map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
          </label>
        ) : null)}
        {options.priceOnRequest.length > 0 ? (
          <label className={styles.field}>
            <span>Цена</span>
            <select name="priceOnRequest" value={filters.priceOnRequest ?? ""} onChange={(event) => setFilter("priceOnRequest", event.target.value)}>
              <option value="">Любая</option>
              <option value="yes">По запросу</option>
              <option value="no">Указана</option>
            </select>
          </label>
        ) : null}
      </>
    );
  }

  return (
    <div className="w-full max-w-full min-w-0">
      {hasFilters ? (
        <>
          <form className={styles.filters} method="get" aria-label="Фильтры каталога дисков">
            {renderFields()}
            <button className="btn-accent" type="submit">Показать модели</button>
            <Link className={styles.reset} href={typeBasePath}>Сбросить фильтры</Link>
          </form>
          <MobileFilterSheet
            title="Параметры диска"
            triggerLabel="Фильтры"
            activeCount={activeFilterCount}
            applyLabel={`Показать ${formatWheelModelCount(visibleModels.length)}`}
            resetHref={typeBasePath}
            formLabel="Параметры диска"
          >
            {renderFields()}
          </MobileFilterSheet>
        </>
      ) : null}

      <div className={styles.resultHeader} aria-live="polite">
        <p>{formatWheelModelCount(visibleModels.length)}</p>
        <p>Модели по параметрам диска</p>
      </div>

      {visibleModels.length > 0 ? (
        <div className={`${styles.modelGrid} w-full max-w-full min-w-0`}>
          {visibleModels.map((model) => (
            <CatalogCard
              key={model.id}
              href={`${typeBasePath}/${model.slug}`}
              title={model.name}
              description={model.descriptionShort}
              meta={[model.series?.trim(), model.designStyle?.trim()].filter(Boolean).join(" · ") || null}
              imageUrl={model.imageUrl}
              imageAlt={`${model.name} — диск BIZON`}
              mediaKey={model.slug}
            />
          ))}
        </div>
      ) : (
        <div className={styles.emptyState}>
          <p className={styles.eyebrow}>Результаты фильтрации</p>
          <h2>По заданным параметрам диски не найдены</h2>
          <p>Измените параметры фильтров или сбросьте их, чтобы посмотреть другие модели.</p>
          <div className={styles.emptyActions}>
            <Link className="btn-secondary" href={typeBasePath}>Очистить фильтры</Link>
          </div>
        </div>
      )}
    </div>
  );
}
