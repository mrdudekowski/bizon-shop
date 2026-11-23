"use client";

import { useEffect, useState } from "react";
import { BrandModelName } from "@/components/BrandModelName/BrandModelName";
import { CatalogCard } from "@/components/catalog/CatalogCard";
import { MobileFilterSheet } from "@/components/catalog/MobileFilterSheet";
import { CatalogSelectionFeedback } from "@/components/catalog/CatalogSelectionFeedback";
import { CustomSelect } from "@/components/ui/CustomSelect";
import type { CmsWheelModel, CmsWheelVariant } from "@/lib/content/types";
import {
  filterWheelModels,
  formatWheelModelCount,
  getWheelFilterOptions,
  parseWheelFilters,
  type WheelFilters,
} from "@/lib/catalog/wheelFilters";
import { patchFilterSearchParams } from "@/lib/catalog/filterUrlState";

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

const WHEEL_FILTER_KEYS = [
  "designStyle", "series", "diameter", "width", "pcd", "offsetET", "centerBore", "color", "priceOnRequest",
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
    const readFiltersFromUrl = () => {
      setFilters(parseWheelFilters(new URLSearchParams(window.location.search), models, variants));
    };
    readFiltersFromUrl();
    window.addEventListener("popstate", readFiltersFromUrl);
    return () => window.removeEventListener("popstate", readFiltersFromUrl);
  }, [models, variants]);

  function replaceFilterUrl(next: WheelFilters) {
    const values: Record<string, string | undefined> = { ...next };
    const query = patchFilterSearchParams(new URLSearchParams(window.location.search), WHEEL_FILTER_KEYS, values);
    const search = query ? `?${query}` : "";
    window.history.replaceState(window.history.state, "", `${window.location.pathname}${search}${window.location.hash}`);
  }

  function setFilter(key: keyof WheelFilters, value: string) {
    const next = { ...filters, [key]: value || undefined };
    setFilters(next);
    replaceFilterUrl(next);
  }

  function resetFilters() {
    setFilters({});
    replaceFilterUrl({});
  }

  function renderFields() {
    return (
      <>
        {FILTER_FIELDS.map(({ key, label, empty }) => options[key].length > 0 ? (
          <label className={styles.field} key={key}>
            <span>{label}</span>
            <CustomSelect name={key} value={filters[key] ?? ""} onValueChange={(value) => setFilter(key, value)} options={[
              { value: "", label: empty },
              ...options[key].map((option) => ({ value: option, label: option })),
            ]} />
          </label>
        ) : null)}
        {options.priceOnRequest.length > 0 ? (
          <label className={styles.field}>
            <span>Цена</span>
            <CustomSelect name="priceOnRequest" value={filters.priceOnRequest ?? ""} onValueChange={(value) => setFilter("priceOnRequest", value)} options={[
              { value: "", label: "Любая" },
              { value: "yes", label: "По запросу" },
              { value: "no", label: "Указана" },
            ]} />
          </label>
        ) : null}
      </>
    );
  }

  return (
    <div className="w-full max-w-full min-w-0">
      {hasFilters ? (
        <>
          <div className={styles.filters} role="group" aria-label="Фильтры каталога дисков">
            {renderFields()}
            <button className={styles.reset} type="button" onClick={resetFilters}>Сбросить фильтры</button>
          </div>
          <MobileFilterSheet
            title="Параметры диска"
            triggerLabel="Фильтры"
            activeCount={activeFilterCount}
            resultCount={formatWheelModelCount(visibleModels.length)}
            onReset={resetFilters}
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
          {visibleModels.map((model) => {
            return (
              <CatalogCard
                key={model.id}
                href={`${typeBasePath}/${model.slug}`}
                title={<BrandModelName name={model.name} />}
                description={model.descriptionShort}
                meta={[model.series?.trim(), model.designStyle?.trim()].filter(Boolean).join(" · ") || null}
                imageUrl={model.imageUrl}
                imageAlt={`${model.name} — диск BIZON`}
                mediaKey={model.slug}
                mediaFit="cover"
                disableShopHoverRing
                arrowPlacement="end"
              />
            );
          })}
        </div>
      ) : (
        <div className={styles.emptyState}>
          <p className={styles.eyebrow}>Результаты фильтрации</p>
          {activeFilterCount > 0 ? (
            <CatalogSelectionFeedback kind="wheel" returnHref={typeBasePath} filters={[
              { label: "Стиль", value: filters.designStyle },
              { label: "Серия / исполнение", value: filters.series },
              { label: "Диаметр", value: filters.diameter },
              { label: "Ширина", value: filters.width },
              { label: "PCD", value: filters.pcd },
              { label: "ET", value: filters.offsetET },
              { label: "DIA", value: filters.centerBore },
              { label: "Цвет", value: filters.color },
              { label: "Цена", value: filters.priceOnRequest === "yes" ? "По запросу" : filters.priceOnRequest === "no" ? "Указана" : undefined },
            ]} />
          ) : (
            <>
              <h2>Модели дисков пока не опубликованы</h2>
              <p>Каталог пополняется. Попробуйте вернуться позже или свяжитесь с BIZON.</p>
            </>
          )}
          <div className={styles.emptyActions}>
            <button className="btn-secondary" type="button" onClick={resetFilters}>Очистить фильтры</button>
          </div>
        </div>
      )}
    </div>
  );
}
