"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { TIRE_CATEGORIES } from "@/lib/catalog/tireCategories";
import { filterTireModels, formatTireModelCount, parseTireFilters, type TireFilters } from "@/lib/catalog/tireFilters";
import type { TireCatalogModel } from "@/lib/catalog/tireReadModel";
import { AXLE_OPTIONS } from "@/lib/selection/options";
import { MobileFilterSheet } from "@/components/catalog/MobileFilterSheet";

import styles from "./TireCatalog.module.css";

type TireCatalogFiltersProps = {
  filters: TireFilters;
  resetHref: string;
  sizes: string[];
  models: TireCatalogModel[];
  lockApplication?: string;
};

export function TireCatalogFilters({
  filters,
  resetHref,
  sizes,
  models,
  lockApplication,
}: TireCatalogFiltersProps) {
  const [draft, setDraft] = useState<TireFilters>(filters);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const parsed = parseTireFilters(params);
    setDraft({ ...parsed, application: lockApplication ?? parsed.application ?? filters.application });
  }, [filters, lockApplication]);

  const appliedModels = filterTireModels(models, {
    ...draft,
    application: lockApplication ?? draft.application,
  });
  const activeCount = [!lockApplication && draft.application, draft.axle, draft.size]
    .filter(Boolean).length;

  function renderFields(formKey: string) {
    return (
      <>
        {lockApplication ? <input type="hidden" name="application" value={lockApplication} readOnly /> : (
          <label className={styles.field}>
            <span>Применение</span>
            <select
              name="application"
              value={draft.application ?? ""}
              onChange={(event) => setDraft((current) => ({ ...current, application: event.target.value || undefined }))}
            >
              <option value="">Все условия</option>
              {TIRE_CATEGORIES.map((category) => (
                <option key={category.value} value={category.value}>{category.name}</option>
              ))}
            </select>
          </label>
        )}

        <label className={styles.field}>
          <span>Ось</span>
          <select
            name="axle"
            value={draft.axle ?? ""}
            onChange={(event) => setDraft((current) => ({
              ...current,
              axle: (event.target.value || undefined) as TireFilters["axle"],
            }))}
          >
            <option value="">Любая ось</option>
            {AXLE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </label>

        <label className={styles.field}>
          <span>Типоразмер</span>
          <input
            name="size"
            type="text"
            list={`tire-size-options-${formKey}`}
            value={draft.size ?? ""}
            placeholder="Например, 315/80R22.5"
            autoComplete="off"
            onChange={(event) => setDraft((current) => ({ ...current, size: event.target.value || undefined }))}
          />
          <datalist id={`tire-size-options-${formKey}`}>
            {sizes.map((size) => <option key={size} value={size} />)}
          </datalist>
        </label>
      </>
    );
  }

  return (
    <>
      <form className={styles.filters} method="get" aria-label="Фильтры каталога">
        {renderFields("desktop")}
        <button className="btn-accent" type="submit">Показать модели</button>
        <Link className={styles.reset} href={resetHref}>Сбросить фильтры</Link>
      </form>
      <MobileFilterSheet
        title="Фильтры каталога шин"
        triggerLabel="Фильтры"
        activeCount={activeCount}
        applyLabel={`Показать ${formatTireModelCount(appliedModels.length)}`}
        resetHref={resetHref}
        formLabel="Фильтры каталога шин"
      >
        {renderFields("mobile")}
      </MobileFilterSheet>
    </>
  );
}
