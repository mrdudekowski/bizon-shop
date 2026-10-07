import Link from "next/link";

import { SiteArrow } from "@/components/SiteArrow/SiteArrow";

import { AssortmentCarousel } from "@/components/main/AssortmentCarousel";
import { pickAssortmentModels } from "@/lib/catalog/featuredAssortment";
import type { TireCatalogReadModel } from "@/lib/catalog/tireReadModel";
import type { PageShell } from "@/lib/content/pages/types";

import styles from "./MainHome.module.css";

export function TireDirectionShowcase({
  catalog,
  content,
}: {
  catalog: TireCatalogReadModel | null;
  content: PageShell;
}) {
  const models = catalog ? pickAssortmentModels(catalog) : [];

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
            Перейти в каталог <SiteArrow />
          </Link>
        </div>

        {catalog === null ? (
          <div className={styles.assortmentEmpty} role="alert">
            <p>Каталог временно недоступен. Попробуйте ещё раз через минуту.</p>
            <form>
              <button className="btn-secondary" type="submit">Попробовать ещё раз</button>
            </form>
          </div>
        ) : models.length > 0 ? (
          <AssortmentCarousel models={models} />
        ) : (
          <p className={styles.assortmentEmpty}>Модели появятся после публикации каталога.</p>
        )}
      </div>
    </section>
  );
}
