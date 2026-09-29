"use client";

import { AdvantageIcons } from "@/components/catalog/AdvantageIcons";
import { SiteArrow } from "@/components/SiteArrow/SiteArrow";
import { CatalogImage } from "@/components/catalog/CatalogImage";
import { cardSubtitle, formatAxleLabels } from "@/lib/catalog/featuredAssortment";
import type { TireCatalogModel } from "@/lib/catalog/tireReadModel";
import Link from "next/link";

import styles from "./MainHome.module.css";

export function AssortmentCarousel({ models }: { models: TireCatalogModel[] }) {
  if (models.length === 0) return null;

  return (
    <div className={styles.assortmentTrack} aria-label="Ключевые модели шин">
      {models.map((model) => (
        <Link key={model.id} className={styles.assortmentCard} href={model.href}>
          <span className={styles.assortmentMedia}>
            <CatalogImage
              src={model.imageUrl || model.gallery[0]}
              alt={model.name}
              fill
              sizes="(max-width: 639px) 100vw, (max-width: 1023px) 50vw, 28vw"
              fallbackKey={model.slug}
            />
          </span>
          <span className={styles.assortmentCardHead}>
            <span>
              <strong>{model.name}</strong>
              <span className={styles.assortmentStatus}>{cardSubtitle(model)}</span>
            </span>
            <span className={styles.assortmentArrow} aria-hidden="true">
              <SiteArrow />
            </span>
          </span>
          <span className={styles.assortmentCardBody}>
            <span className={styles.assortmentSpecs}>
              <span>
                <span>Ось</span>
                {formatAxleLabels(model)}
              </span>
            </span>
            <AdvantageIcons advantages={model.advantages} className={styles.assortmentIcons} />
          </span>
        </Link>
      ))}
    </div>
  );
}
