"use client";

import { useMemo, useState } from "react";
import { CatalogCard } from "@/components/catalog/CatalogCard";
import type { CmsWheelModel, CmsWheelVariant } from "@/lib/cms/types";

type WheelModelGridProps = {
  models: CmsWheelModel[];
  variants: CmsWheelVariant[];
  typeBasePath: string;
};

type FilterState = {
  diameter: string;
  width: string;
  pcd: string;
  offsetET: string;
  centerBore: string;
  color: string;
  priceOnRequest: string;
};

const EMPTY_FILTERS: FilterState = {
  diameter: "",
  width: "",
  pcd: "",
  offsetET: "",
  centerBore: "",
  color: "",
  priceOnRequest: "",
};

function uniqueValues(variants: CmsWheelVariant[], key: keyof CmsWheelVariant): string[] {
  const values = new Set<string>();
  for (const variant of variants) {
    const raw = variant[key];
    if (raw == null || raw === "") continue;
    values.add(String(raw));
  }
  return [...values].sort((a, b) => a.localeCompare(b, "ru"));
}

function variantMatchesFilters(variant: CmsWheelVariant, filters: FilterState): boolean {
  if (filters.diameter && String(variant.diameter ?? "") !== filters.diameter) return false;
  if (filters.width && String(variant.width ?? "") !== filters.width) return false;
  if (filters.pcd && (variant.pcd ?? "") !== filters.pcd) return false;
  if (filters.offsetET && String(variant.offsetET ?? "") !== filters.offsetET) return false;
  if (filters.centerBore && String(variant.centerBore ?? "") !== filters.centerBore) return false;
  if (filters.color && (variant.color ?? "") !== filters.color) return false;
  if (filters.priceOnRequest === "yes" && !variant.priceOnRequest) return false;
  if (filters.priceOnRequest === "no" && variant.priceOnRequest) return false;
  return true;
}

function FilterSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  if (options.length === 0) return null;

  return (
    <label className="flex flex-col gap-1 text-sm min-w-0">
      <span className="text-muted">{label}</span>
      <select
        className="rounded-md border border-border bg-background px-2 py-1.5 min-w-0 max-w-full"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        <option value="">Все</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

export function WheelModelGrid({ models, variants, typeBasePath }: WheelModelGridProps) {
  const [filters, setFilters] = useState<FilterState>(EMPTY_FILTERS);

  const filterOptions = useMemo(
    () => ({
      diameter: uniqueValues(variants, "diameter"),
      width: uniqueValues(variants, "width"),
      pcd: uniqueValues(variants, "pcd"),
      offsetET: uniqueValues(variants, "offsetET"),
      centerBore: uniqueValues(variants, "centerBore"),
      color: uniqueValues(variants, "color"),
    }),
    [variants],
  );

  const visibleModels = useMemo(() => {
    const hasActiveFilter = Object.values(filters).some(Boolean);
    if (!hasActiveFilter) return models;

    const matchingModelIds = new Set(
      variants.filter((variant) => variantMatchesFilters(variant, filters)).map((v) => v.modelId),
    );

    return models.filter((model) => matchingModelIds.has(model.id));
  }, [filters, models, variants]);

  const hasFilters =
    filterOptions.diameter.length > 0 ||
    filterOptions.width.length > 0 ||
    filterOptions.pcd.length > 0 ||
    filterOptions.offsetET.length > 0 ||
    filterOptions.centerBore.length > 0 ||
    filterOptions.color.length > 0;

  return (
    <div className="w-full max-w-full min-w-0">
      {hasFilters && (
        <div className="card-base info-card mb-6 w-full max-w-full min-w-0">
          <h2 className="info-card-title text-base mb-4">Фильтр по параметрам</h2>
          <div className="grid grid-cols-1 min-[480px]:grid-cols-2 lg:grid-cols-3 gap-4 w-full max-w-full min-w-0">
            <FilterSelect
              label="Диаметр"
              value={filters.diameter}
              options={filterOptions.diameter}
              onChange={(diameter) => setFilters((prev) => ({ ...prev, diameter }))}
            />
            <FilterSelect
              label="Ширина"
              value={filters.width}
              options={filterOptions.width}
              onChange={(width) => setFilters((prev) => ({ ...prev, width }))}
            />
            <FilterSelect
              label="PCD"
              value={filters.pcd}
              options={filterOptions.pcd}
              onChange={(pcd) => setFilters((prev) => ({ ...prev, pcd }))}
            />
            <FilterSelect
              label="ET"
              value={filters.offsetET}
              options={filterOptions.offsetET}
              onChange={(offsetET) => setFilters((prev) => ({ ...prev, offsetET }))}
            />
            <FilterSelect
              label="DIA"
              value={filters.centerBore}
              options={filterOptions.centerBore}
              onChange={(centerBore) => setFilters((prev) => ({ ...prev, centerBore }))}
            />
            <FilterSelect
              label="Цвет"
              value={filters.color}
              options={filterOptions.color}
              onChange={(color) => setFilters((prev) => ({ ...prev, color }))}
            />
            <label className="flex flex-col gap-1 text-sm min-w-0">
              <span className="text-muted">Цена по запросу</span>
              <select
                className="rounded-md border border-border bg-background px-2 py-1.5 min-w-0 max-w-full"
                value={filters.priceOnRequest}
                onChange={(event) =>
                  setFilters((prev) => ({ ...prev, priceOnRequest: event.target.value }))
                }
              >
                <option value="">Все</option>
                <option value="yes">Только «по запросу»</option>
                <option value="no">С указанной ценой</option>
              </select>
            </label>
          </div>
        </div>
      )}

      {visibleModels.length > 0 ? (
        <div className="section-grid w-full max-w-full min-w-0">
          {visibleModels.map((model) => (
            <CatalogCard
              key={model.slug}
              href={`${typeBasePath}/${model.slug}`}
              title={model.name}
              description={model.descriptionShort}
              meta={[model.series, model.designStyle].filter(Boolean).join(" · ") || null}
              imageUrl={model.imageUrl}
              imageAlt={model.name}
            />
          ))}
        </div>
      ) : (
        <p className="section-description">Нет моделей по выбранным фильтрам.</p>
      )}
    </div>
  );
}
