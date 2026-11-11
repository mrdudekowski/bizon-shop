"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { TIRE_CATEGORIES } from "@/lib/catalog/tireCategories";
import { filterTireModels, formatTireModelCount, parseTireFilters, type TireFilters } from "@/lib/catalog/tireFilters";
import type { TireCatalogModel } from "@/lib/catalog/tireReadModel";
import { AXLE_OPTIONS } from "@/lib/selection/options";
import { MobileFilterSheet } from "@/components/catalog/MobileFilterSheet";
import { CustomSelect } from "@/components/ui/CustomSelect";

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
            <CustomSelect
              name="application"
              value={draft.application ?? ""}
              onValueChange={(application) => setDraft((current) => ({ ...current, application: application || undefined }))}
              options={[{ value: "", label: "Все условия" }, ...TIRE_CATEGORIES.map((category) => ({ value: category.value, label: category.name }))]}
            />
          </label>
        )}

        <label className={styles.field}>
          <span>Ось</span>
          <CustomSelect
            name="axle"
            value={draft.axle ?? ""}
            onValueChange={(axle) => setDraft((current) => ({
              ...current,
              axle: (axle || undefined) as TireFilters["axle"],
            }))}
            options={[{ value: "", label: "Любая ось" }, ...AXLE_OPTIONS.map((option) => ({ value: option.value, label: option.label }))]}
          />
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
