import Link from "next/link";

import { AssortmentCarousel } from "@/components/main/AssortmentCarousel";
import { pickAssortmentModels } from "@/lib/catalog/featuredAssortment";
import type { TireCatalogReadModel } from "@/lib/catalog/tireReadModel";
import type { PageShell } from "@/lib/content/pages/types";

import styles from "./MainHome.module.css";

export function TireDirectionShowcase({
  catalog,
  content,
}: {
  catalog: TireCatalogReadModel;
  content: PageShell;
}) {
  const models = pickAssortmentModels(catalog);

  return (
    <section
      className={styles.directionSection}
      data-main-chrome-tone="light"
      aria-labelledby="home-assortment-title"
    >
      <img
        className={styles.directionWatermark}
        src="/brand/bizon.svg"
        alt=""
        aria-hidden="true"
        draggable={false}
      />
      <div className={styles.assortmentContent}>
        <div className={styles.assortmentIntro}>
          <h2 id="home-assortment-title">{content.title}</h2>
          <p>{content.lead}</p>
          <Link className={`btn-accent ${styles.assortmentCta}`} href="/models">
            Перейти в каталог <span aria-hidden="true">→</span>
          </Link>
        </div>

        {models.length > 0 ? (
          <AssortmentCarousel models={models} />
        ) : (
          <p className={styles.assortmentEmpty}>Модели появятся после публикации каталога.</p>
        )}
      </div>
    </section>
  );
}
