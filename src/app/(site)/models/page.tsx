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
              <article className={styles.directionCard} key={direction.slug}>
                <Link className={styles.directionMedia} href={`/models/${direction.slug}`} aria-label={`Открыть ${direction.name}`}>
                  <CatalogImage src={direction.imageUrl} fallbackKey={direction.slug} alt={direction.name} fill sizes="(max-width: 767px) 100vw, 50vw" />
                </Link>
                <div className={styles.directionBody}>
                  <p className={styles.eyebrow}>{direction.models.length} моделей · доступно к заказу</p>
                  <h2>{direction.name}</h2>
                  <p>{direction.shortDescription || direction.description}</p>
                  <Link className={styles.directionLink} href={`/models/${direction.slug}`}>Посмотреть модели и размеры <SiteArrow direction="ne" /></Link>
                </div>
              </article>
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
