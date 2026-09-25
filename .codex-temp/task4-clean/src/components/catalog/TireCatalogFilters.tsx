import Link from "next/link";

import { TIRE_CATEGORIES } from "@/lib/catalog/tireCategories";
import type { TireFilters } from "@/lib/catalog/tireFilters";
import { AXLE_OPTIONS } from "@/lib/selection/options";

import styles from "./TireCatalog.module.css";

type TireCatalogFiltersProps = {
  filters: TireFilters;
  resetHref: string;
  sizes: string[];
  lockApplication?: string;
};

export function TireCatalogFilters({
  filters,
  resetHref,
  sizes,
  lockApplication,
}: TireCatalogFiltersProps) {
  return (
    <form className={styles.filters} method="get" aria-label="Фильтры каталога">
      {lockApplication ? (
        <input type="hidden" name="application" value={lockApplication} />
      ) : (
        <label className={styles.field}>
          <span>Применение</span>
          <select name="application" defaultValue={filters.application ?? ""}>
            <option value="">Все условия</option>
            {TIRE_CATEGORIES.map((category) => (
              <option key={category.value} value={category.value}>
                {category.name}
              </option>
            ))}
          </select>
        </label>
      )}

      <label className={styles.field}>
        <span>Ось</span>
        <select name="axle" defaultValue={filters.axle ?? ""}>
          <option value="">Любая ось</option>
          {AXLE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>

      <label className={styles.field}>
        <span>Типоразмер</span>
        <input
          name="size"
          type="text"
          list="tire-size-options"
          defaultValue={filters.size ?? ""}
          placeholder="Например, 315/80R22.5"
          autoComplete="off"
        />
        <datalist id="tire-size-options">
          {sizes.map((size) => (
            <option key={size} value={size} />
          ))}
        </datalist>
      </label>

      <button className="btn-accent" type="submit">
        Показать модели
      </button>
      <Link className={styles.reset} href={resetHref}>
        Сбросить фильтры
      </Link>
    </form>
  );
}
