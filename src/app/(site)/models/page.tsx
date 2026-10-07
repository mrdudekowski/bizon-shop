import Link from "next/link";

import { CatalogImage } from "@/components/catalog/CatalogImage";
import { PageHeader } from "@/components/catalog/PageHeader";
import { SiteArrow } from "@/components/SiteArrow/SiteArrow";
import { PublishedContentUnavailable } from "@/components/content/PublishedContentUnavailable";
import styles from "@/components/catalog/TireCatalog.module.css";
import { getPublishedTireCatalog } from "@/lib/content";
import { loadPublished } from "@/lib/content/loadPublished";
import { createPageMetadata } from "@/lib/seo/metadata";

export const metadata = createPageMetadata({
  title: "Модели",
  description: "Категории и модели большегрузной резины BIZON.",
  path: "/models",
});

export default async function ModelsPage() {
  const loaded = await loadPublished(getPublishedTireCatalog);
  if (loaded.kind === "unavailable") {
    return (
      <PublishedContentUnavailable
        title="Каталог шин временно недоступен"
        message="Не получилось загрузить каталог. Попробуйте ещё раз через минуту."
      />
    );
  }
  const catalog = loaded.value;

  return (
    <div className={styles.catalogPage} data-main-chrome-tone="light">
      <div className={styles.pageInner}>
        <PageHeader
          title="Модели и размеры под вашу эксплуатацию"
          description="Выберите тип техники и сценарий работы, чтобы перейти к подходящим моделям, осям и типоразмерам."
          breadcrumbs={[{ href: "/", label: "Главная" }, { href: "/models", label: "Каталог" }]}
        />
        {catalog.directions.length ? (
          <div className={styles.directionGrid}>
            {catalog.directions.map((direction) => (
              <Link className={styles.directionCard} href={`/models/${direction.slug}`} key={direction.slug}>
                <CatalogImage
                  src={direction.imageUrl}
                  fallbackKey={direction.slug}
                  alt=""
                  fill
                  sizes="(max-width: 767px) 100vw, 50vw"
                />
                <span className={styles.directionScrim} aria-hidden="true" />
                <span className={styles.directionBody}>
                  <span className={styles.eyebrow}>
                    {direction.models.length} {direction.models.length === 1 ? "модель" : direction.models.length > 1 && direction.models.length < 5 ? "модели" : "моделей"}
                    {direction.models.length ? " · доступно к заказу" : null}
                  </span>
                  <h2 className={styles.directionTitle}>{direction.name}</h2>
                  <span className={styles.directionDescription}>{direction.shortDescription || direction.description}</span>
                  <span className={styles.directionLink}>Посмотреть модели и размеры <SiteArrow direction="ne" /></span>
                </span>
              </Link>
            ))}
          </div>
        ) : (
          <div className={styles.emptyState}>
            <p className={styles.eyebrow}>Каталог проверяется</p>
            <h2>Уточним решение под вашу задачу</h2>
            <p>Опубликованных направлений сейчас нет. Свяжитесь с командой BIZON для консультации.</p>
            <Link className="btn-accent" href="/contact?subject=tire-selection">Запросить наличие и предложение</Link>
          </div>
        )}
      </div>
    </div>
  );
}
