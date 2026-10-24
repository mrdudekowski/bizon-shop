"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CatalogImage } from "@/components/catalog/CatalogImage";
import { fetchBrowserTireCatalog } from "@/lib/catalog/browserTireCatalog";
import type { TireCatalogReadModel } from "@/lib/catalog/tireReadModel";
import styles from "@/components/catalog/TireCatalog.module.css";

export function TireCatalogIndexRuntime({ initialCatalog }: { initialCatalog: TireCatalogReadModel }) {
  const [catalog, setCatalog] = useState(initialCatalog);
  useEffect(() => {
    const controller = new AbortController();
    void fetchBrowserTireCatalog(controller.signal).then(setCatalog).catch((error: unknown) => {
      if (!controller.signal.aborted) console.warn("Could not refresh published tire catalog; showing generated content.", error);
    });
    return () => controller.abort();
  }, []);

  return <div className={styles.catalogPage} data-main-chrome-tone="light">
    <div className={styles.pageInner}>
      <h1 className={styles.visuallyHidden}>Каталог моделей шин</h1>
      {catalog.directions.length ? <div className={styles.directionGrid}>
        {catalog.directions.map((direction) => <Link
          className={styles.directionCard}
          href={`/models/${direction.slug}`}
          key={direction.slug}
          aria-label={`${direction.name}. ${direction.shortDescription || direction.description}`}
        >
          <CatalogImage src={direction.imageUrl} fallbackKey={direction.slug} alt="" fill sizes="(max-width: 767px) 100vw, 50vw" />
          <span className={styles.directionScrim} aria-hidden="true" />
          <span className={styles.directionBody}>
            <h2 className={styles.directionTitle}>{direction.slug.toUpperCase()}</h2>
            <span className={styles.directionDetails}>
              <span className={`${styles.eyebrow} ${styles.directionCount}`}>
                {direction.models.length} {direction.models.length === 1 ? "модель" : direction.models.length > 1 && direction.models.length < 5 ? "модели" : "моделей"}{direction.models.length ? " · доступно к заказу" : null}
              </span>
              <span className={styles.directionDescription}>{direction.shortDescription || direction.description}</span>
            </span>
          </span>
        </Link>)}
      </div> : <div className={styles.emptyState}>
        <p className={styles.eyebrow}>Каталог проверяется</p>
        <h2>Уточним решение под вашу задачу</h2>
        <p>Опубликованных направлений сейчас нет. Свяжитесь с командой BIZON для консультации.</p>
        <Link className="btn-accent" href="/contact?subject=tire-selection">Запросить наличие и предложение</Link>
      </div>}
    </div>
  </div>;
}
