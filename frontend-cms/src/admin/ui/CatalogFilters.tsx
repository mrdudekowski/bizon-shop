"use client";

import type { DocumentStatus } from "@/admin/domain/types";
import styles from "./catalog.module.css";

type CatalogStatus = "all" | DocumentStatus;
type SubcategoryOption = { id: string; name: string };

export function CatalogFilters({
  query,
  onQueryChange,
  status,
  onStatusChange,
  placeholder,
  subcategoryId,
  subcategories,
  onSubcategoryChange,
}: {
  query: string;
  onQueryChange: (value: string) => void;
  status: CatalogStatus;
  onStatusChange: (value: CatalogStatus) => void;
  placeholder: string;
  subcategoryId?: string;
  subcategories?: SubcategoryOption[];
  onSubcategoryChange?: (value: string) => void;
}) {
  return (
    <div className={styles.filters}>
      <label>
        Поиск
        <input type="search" placeholder={placeholder} value={query} onChange={(event) => onQueryChange(event.target.value)} />
      </label>
      <label>
        Статус
        <select value={status} onChange={(event) => onStatusChange(event.target.value as CatalogStatus)}>
          <option value="all">Все статусы</option>
          <option value="draft">Черновик</option>
          <option value="on_site">На сайте</option>
          <option value="hidden">Скрыто</option>
        </select>
      </label>
      {subcategories && subcategories.length > 0 && onSubcategoryChange ? <label>
        Подкатегория
        <select value={subcategoryId ?? ""} onChange={(event) => onSubcategoryChange(event.target.value)}>
          <option value="">Все подкатегории</option>
          {subcategories.map((subcategory) => <option key={subcategory.id} value={subcategory.id}>{subcategory.name}</option>)}
        </select>
      </label> : null}
    </div>
  );
}
