"use client";

import { SiteArrow } from "@/components/SiteArrow/SiteArrow";
import { CatalogImage } from "@/components/catalog/CatalogImage";
import { LoopedStrip } from "@/components/catalog/LoopedStrip";
import { cardSubtitle, formatAxleLabels } from "@/lib/catalog/featuredAssortment";
import { getModelApplicationCategories } from "@/lib/catalog/tireCategories";
import type { TireCatalogModel } from "@/lib/catalog/tireReadModel";
import Link from "next/link";

import styles from "./MainHome.module.css";

export function AssortmentCarousel({ models }: { models: TireCatalogModel[] }) {
  if (models.length === 0) return null;

  return (
    <LoopedStrip count={models.length} label="Ключевые модели шин" tone="light">
      {(index) => {
        const model = models[index];
        const applications = getModelApplicationCategories(model);
        const subtitle = cardSubtitle(model);
        const remainingSubtitle = applications.length > 0 && model.selectionAxles.length !== 1
          ? ""
          : subtitle;

        return (
          <Link className={styles.assortmentCard} href={model.href}>
            <span className={styles.assortmentMedia}>
              <CatalogImage
                src={model.imageUrl || model.gallery[0]}
                alt={model.name}
                fill
                sizes="(max-width: 639px) 100vw, 28rem"
                fallbackKey={model.slug}
              />
              {applications.length > 0 ? (
                <ul className={styles.assortmentApplicationBadges} aria-label="Применение">
                  {applications.map((application) => (
                    <li key={application.icon}>
                      <img
                        src={application.icon}
                        alt={application.name}
                        title={application.name}
                        width={40}
                        height={40}
                      />
                    </li>
                  ))}
                </ul>
              ) : null}
            </span>
            <span className={styles.assortmentCardHead}>
              <span>
                <strong>{model.name}</strong>
                <span className={styles.assortmentStatus}>
                  {remainingSubtitle}
                </span>
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
            </span>
          </Link>
        );
      }}
    </LoopedStrip>
  );
}
