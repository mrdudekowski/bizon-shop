import Link from "next/link";

import { AssortmentCarousel } from "@/components/main/AssortmentCarousel";
import type { TireCatalogModel, TireCatalogReadModel } from "@/lib/catalog/tireReadModel";
import type { PageShell } from "@/lib/content/pages/types";

import styles from "./MainHome.module.css";

const ASSORTMENT_PREVIEW_COUNT = 6;

function assortmentModels(catalog: TireCatalogReadModel): TireCatalogModel[] {
  const models = catalog.directions.flatMap((direction) => direction.models);
  const withImage = models.filter((model) => model.imageUrl || model.gallery[0]);
  return (withImage.length > 0 ? withImage : models).slice(0, ASSORTMENT_PREVIEW_COUNT);
}

export function TireDirectionShowcase({
  catalog,
  content,
}: {
  catalog: TireCatalogReadModel;
  content: PageShell;
}) {
  const models = assortmentModels(catalog);

  return (
    <section
      className={styles.directionSection}
      data-home-tone="dark"
      data-main-chrome-tone="dark"
      aria-labelledby="home-assortment-title"
    >
      <div className={styles.assortmentContent}>
        <div className={styles.assortmentIntro}>
          <p className={styles.assortmentKicker}>{content.eyebrow}</p>
          <h2 id="home-assortment-title">{content.title}</h2>
          <p>{content.lead}</p>
        </div>

        <AssortmentCarousel models={models} />

        <div className={styles.assortmentActions}>
          <Link className="btn-accent" href="/models">
            Все модели
          </Link>
        </div>
      </div>
    </section>
  );
}
