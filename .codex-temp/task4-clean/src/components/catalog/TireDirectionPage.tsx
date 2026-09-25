import Link from "next/link";

import { TireCatalogFilters } from "@/components/catalog/TireCatalogFilters";
import { TireModelCard } from "@/components/catalog/TireModelCard";
import { PageHeader } from "@/components/catalog/PageHeader";
import { getTireCategoryBySlug } from "@/lib/catalog/tireCategories";
import { filterTireModels, type TireFilters } from "@/lib/catalog/tireFilters";
import type { TireCatalogDirection } from "@/lib/catalog/tireReadModel";

import styles from "./TireCatalog.module.css";

type TireDirectionPageProps = {
  direction: TireCatalogDirection;
  filters: TireFilters;
  categorySlug?: string;
};

function formatModelCount(count: number): string {
  if (count % 10 === 1 && count % 100 !== 11) return `${count} модель`;
  if ([2, 3, 4].includes(count % 10) && ![12, 13, 14].includes(count % 100)) {
    return `${count} модели`;
  }
  return `${count} моделей`;
}

export function TireDirectionPage({
  direction,
  filters,
  categorySlug,
}: TireDirectionPageProps) {
  const category = categorySlug ? getTireCategoryBySlug(categorySlug) : undefined;
  const effectiveFilters = category
    ? { ...filters, application: category.value }
    : filters;
  const models = filterTireModels(direction.models, effectiveFilters);
  const typePath = `/models/${direction.slug}`;
  const pagePath = category ? `${typePath}/${category.slug}` : typePath;
  const sizes = Array.from(new Set(direction.models.flatMap((model) => model.sizes))).sort();

  return (
    <main className={styles.catalogPage} data-main-chrome-tone="light">
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

        <TireCatalogFilters
          filters={effectiveFilters}
          resetHref={pagePath}
          sizes={sizes}
          lockApplication={category?.value}
        />

        <div className={styles.resultHeader} aria-live="polite">
          <p>{formatModelCount(models.length)}</p>
          <p>Отобраны по задаче, оси и типоразмеру</p>
        </div>

        {models.length ? (
          <div className={styles.modelGrid}>{models.map((model) => <TireModelCard key={model.id} model={model} />)}</div>
        ) : (
          <div className={styles.emptyState}>
            <p className={styles.eyebrow}>Нужна проверка специалиста</p>
            <h2>Точного совпадения по фильтрам пока нет</h2>
            <p>Передайте параметры команде BIZON — мы проверим ближайшее решение без обещания неподтверждённой совместимости.</p>
            <div className={styles.emptyActions}>
              <Link className="btn-accent" href="/contact?subject=tire-selection">Запросить подбор</Link>
              <Link className="btn-secondary" href={pagePath}>Очистить фильтры</Link>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
