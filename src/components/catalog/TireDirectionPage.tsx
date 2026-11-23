"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { TireCatalogFilters } from "@/components/catalog/TireCatalogFilters";
import { CatalogSelectionFeedback } from "@/components/catalog/CatalogSelectionFeedback";
import { TireModelCard } from "@/components/catalog/TireModelCard";
import { PageHeader } from "@/components/catalog/PageHeader";
import { getTireCategoryBySlug, getTireCategoryByValue } from "@/lib/catalog/tireCategories";
import { filterTireModels, formatTireModelCount, parseTireFilters, type TireFilters } from "@/lib/catalog/tireFilters";
import type { TireCatalogDirection } from "@/lib/catalog/tireReadModel";
import { fetchBrowserTireDirection } from "@/lib/catalog/browserTireCatalog";
import { patchFilterSearchParams } from "@/lib/catalog/filterUrlState";
import { AXLE_OPTIONS } from "@/lib/selection/options";

import styles from "./TireCatalog.module.css";

type TireDirectionPageProps = {
  direction: TireCatalogDirection;
  filters: TireFilters;
  categorySlug?: string;
};

export function TireDirectionPage({
  direction: initialDirection,
  filters,
  categorySlug,
}: TireDirectionPageProps) {
  const [direction, setDirection] = useState(initialDirection);
  const [activeFilters, setActiveFilters] = useState<TireFilters>(filters);
  const category = categorySlug ? getTireCategoryBySlug(categorySlug) : undefined;
  const categoryValue = category?.value;

  useEffect(() => {
    const readFiltersFromUrl = () => {
      const parsed = parseTireFilters(new URLSearchParams(window.location.search));
      setActiveFilters({ ...filters, ...parsed, ...(categoryValue ? { application: categoryValue } : {}) });
    };
    readFiltersFromUrl();
    window.addEventListener("popstate", readFiltersFromUrl);
    return () => window.removeEventListener("popstate", readFiltersFromUrl);
  }, [categoryValue, filters]);

  function updateFilters(next: TireFilters) {
    const normalized = { ...next, ...(category ? { application: category.value } : {}) };
    setActiveFilters(normalized);
    const query = patchFilterSearchParams(
      new URLSearchParams(window.location.search),
      ["application", "axle", "size"],
      normalized,
    );
    const search = query ? `?${query}` : "";
    window.history.replaceState(window.history.state, "", `${window.location.pathname}${search}${window.location.hash}`);
  }

  useEffect(() => {
    const controller = new AbortController();
    void fetchBrowserTireDirection(initialDirection.slug, controller.signal)
      .then((published) => {
        if (controller.signal.aborted) return;
        const initialModels = new Map(initialDirection.models.map((model) => [model.id, model]));
        setDirection({
          ...published,
          models: published.models.map((model) => ({
            ...model,
            sizes: initialModels.get(model.id)?.sizes ?? [],
          })),
        });
      })
      .catch((error: unknown) => {
        if (!controller.signal.aborted) console.warn("Could not refresh published tire direction; showing generated content.", error);
      });
    return () => controller.abort();
  }, [initialDirection]);

  const effectiveFilters = category
    ? { ...activeFilters, application: category.value }
    : activeFilters;
  const models = filterTireModels(direction.models, effectiveFilters);
  const typePath = `/models/${direction.slug}`;
  const pagePath = category ? `${typePath}/${category.slug}` : typePath;
  const sizes = Array.from(new Set(direction.models.flatMap((model) => model.sizes))).sort();

  return (
    <div className={styles.catalogPage} data-main-chrome-tone="light">
      <div className={styles.pageInner}>
        <PageHeader
          title={category ? `${category.name} — ${direction.name}` : direction.name}
          description={category?.description ?? direction.description}
          breadcrumbs={[
            { href: "/", label: "Главная" },
            { href: "/models", label: "Каталог" },
            ...(category ? [{ href: typePath, label: direction.name }] : []),
            { href: pagePath, label: category?.name ?? direction.name },
          ]}
        />

        {direction.models.length > 0 ? (
          <>
            <TireCatalogFilters
              filters={effectiveFilters}
              sizes={sizes}
              models={direction.models}
              lockApplication={category?.value}
              onChange={updateFilters}
              onReset={() => updateFilters(category ? { application: category.value } : {})}
            />

            <div className={styles.resultHeader} aria-live="polite">
              <p data-tire-result-count>{formatTireModelCount(models.length)}</p>
              <p>Отобраны по задаче, оси и типоразмеру</p>
            </div>
          </>
        ) : null}

        {direction.models.length === 0 ? (
          <div className={styles.emptyState}>
            <p className={styles.eyebrow}>Категория готовится</p>
            <h2>Категория без моделей</h2>
            <p>Модели для этой категории пока не опубликованы. Свяжитесь с командой BIZON, чтобы уточнить доступные решения.</p>
            <div className={styles.emptyActions}>
              <Link className="btn-accent" href="/contact?subject=tire-selection">Связаться с BIZON</Link>
            </div>
          </div>
        ) : models.length ? (
          <div className={styles.modelGrid}>{models.map((model) => <TireModelCard key={model.id} model={model} />)}</div>
        ) : (
          <div className={styles.emptyState}>
            <p className={styles.eyebrow}>Нужна проверка специалиста</p>
            <CatalogSelectionFeedback kind="tire" returnHref={pagePath} filters={[
              { label: "Применение", value: getTireCategoryByValue(effectiveFilters.application ?? "")?.name },
              { label: "Ось", value: AXLE_OPTIONS.find((option) => option.value === effectiveFilters.axle)?.label },
              { label: "Типоразмер", value: effectiveFilters.size },
            ]} />
            <div className={styles.emptyActions}>
              <button className="btn-secondary" type="button" onClick={() => updateFilters(category ? { application: category.value } : {})}>Очистить фильтры</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
