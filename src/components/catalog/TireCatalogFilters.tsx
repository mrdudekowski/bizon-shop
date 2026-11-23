"use client";

import { TIRE_CATEGORIES } from "@/lib/catalog/tireCategories";
import { filterTireModels, formatTireModelCount, type TireFilters } from "@/lib/catalog/tireFilters";
import type { TireCatalogModel } from "@/lib/catalog/tireReadModel";
import { AXLE_OPTIONS } from "@/lib/selection/options";
import { MobileFilterSheet } from "@/components/catalog/MobileFilterSheet";
import { CustomSelect } from "@/components/ui/CustomSelect";

import styles from "./TireCatalog.module.css";

type TireCatalogFiltersProps = {
  filters: TireFilters;
  sizes: string[];
  models: TireCatalogModel[];
  lockApplication?: string;
  onChange: (next: TireFilters) => void;
  onReset: () => void;
};

export function TireCatalogFilters({
  filters,
  sizes,
  models,
  lockApplication,
  onChange,
  onReset,
}: TireCatalogFiltersProps) {
  const appliedModels = filterTireModels(models, {
    ...filters,
    application: lockApplication ?? filters.application,
  });
  const activeCount = [!lockApplication && filters.application, filters.axle, filters.size]
    .filter(Boolean).length;

  function patchFilters(patch: Partial<TireFilters>) {
    const next = { ...filters, ...patch };
    if (lockApplication) next.application = lockApplication;
    onChange(next);
  }

  function renderFields(formKey: string) {
    return (
      <>
        {lockApplication ? <input type="hidden" name="application" value={lockApplication} readOnly /> : (
          <label className={styles.field}>
            <span>Применение</span>
            <CustomSelect
              name="application"
              value={filters.application ?? ""}
              onValueChange={(application) => patchFilters({ application: application || undefined })}
              options={[{ value: "", label: "Все условия" }, ...TIRE_CATEGORIES.map((category) => ({ value: category.value, label: category.name }))]}
            />
          </label>
        )}

        <label className={styles.field}>
          <span>Ось</span>
          <CustomSelect
            name="axle"
            value={filters.axle ?? ""}
            onValueChange={(axle) => patchFilters({ axle: (axle || undefined) as TireFilters["axle"] })}
            options={[{ value: "", label: "Любая ось" }, ...AXLE_OPTIONS.map((option) => ({ value: option.value, label: option.label }))]}
          />
        </label>

        <label className={styles.field}>
          <span>Типоразмер</span>
          <input
            name="size"
            type="text"
            list={`tire-size-options-${formKey}`}
            value={filters.size ?? ""}
            placeholder="Например, 315/80R22.5"
            autoComplete="off"
            onChange={(event) => patchFilters({ size: event.target.value || undefined })}
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
      <div className={styles.filters} role="group" aria-label="Фильтры каталога">
        {renderFields("desktop")}
        <button className={styles.reset} type="button" onClick={onReset}>Сбросить фильтры</button>
      </div>
      <MobileFilterSheet
        title="Фильтры каталога шин"
        triggerLabel="Фильтры"
        activeCount={activeCount}
        resultCount={formatTireModelCount(appliedModels.length)}
        onReset={onReset}
        formLabel="Фильтры каталога шин"
      >
        {renderFields("mobile")}
      </MobileFilterSheet>
    </>
  );
}
