import type { CSSProperties } from "react";
import Link from "next/link";

import { AssortmentCarousel } from "@/components/main/AssortmentCarousel";
import { pickAssortmentModels } from "@/lib/catalog/featuredAssortment";
import type { TireCatalogReadModel } from "@/lib/catalog/tireReadModel";
import type { PageShell } from "@/lib/content/pages/types";
import { PREMIUM_MEDIA } from "@/constants/images";

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
      data-home-tone="dark"
      data-main-chrome-tone="dark"
      aria-labelledby="home-assortment-title"
      style={{ "--assortment-bg": `url("${PREMIUM_MEDIA.inspection}")` } as CSSProperties}
    >
      <p className={styles.assortmentWatermark} aria-hidden="true">
        BIZON
      </p>
      <div className={styles.assortmentContent}>
        <div className={styles.assortmentIntro}>
          <p className={styles.assortmentKicker}>{content.eyebrow}</p>
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
