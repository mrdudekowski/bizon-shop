"use client";

import { useRef } from "react";
import { SiteArrow } from "@/components/SiteArrow/SiteArrow";
import { CatalogImage } from "@/components/catalog/CatalogImage";
import { HorizontalScrollCue } from "@/components/catalog/HorizontalScrollCue";
import { cardSubtitle, formatAxleLabels } from "@/lib/catalog/featuredAssortment";
import { getModelApplicationCategories } from "@/lib/catalog/tireCategories";
import type { TireCatalogModel } from "@/lib/catalog/tireReadModel";
import Link from "next/link";

import { useLoopingTrack } from "@/components/catalog/useLoopingTrack";
import styles from "./MainHome.module.css";

export function AssortmentCarousel({ models }: { models: TireCatalogModel[] }) {
  const trackRef = useRef<HTMLDivElement>(null);
  useLoopingTrack(trackRef, models.length);

  if (models.length === 0) return null;

  return (
    <div className={styles.assortmentCarouselWrap}>
      <div ref={trackRef} className={styles.assortmentTrack} aria-label="Ключевые модели шин">
        {[0, 1].flatMap((copy) => models.map((model) => {
          const applications = getModelApplicationCategories(model);
          const subtitle = cardSubtitle(model);
          const remainingSubtitle = applications.length > 0 && model.selectionAxles.length !== 1
            ? ""
            : subtitle;
          const clone = copy === 1;

          return (
            <Link
              key={clone ? `${model.id}-loop` : model.id}
              className={clone ? `${styles.assortmentCard} ${styles.loopClone}` : styles.assortmentCard}
              href={model.href}
              aria-hidden={clone || undefined}
              tabIndex={clone ? -1 : undefined}
            >
            <span className={styles.assortmentMedia}>
              <CatalogImage
                src={model.imageUrl || model.gallery[0]}
                alt={clone ? "" : model.name}
                fill
                sizes="(max-width: 639px) 100vw, (max-width: 1023px) 50vw, 28vw"
                fallbackKey={model.slug}
              />
              {applications.length > 0 ? (
                <ul className={styles.assortmentApplicationBadges} aria-label={clone ? undefined : "Применение"}>
                  {applications.map((application) => (
                    <li key={application.icon}>
                      <img
                        src={application.icon}
                        alt={clone ? "" : application.name}
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
        }))}
      </div>
      {models.length > 1 ? <HorizontalScrollCue trackRef={trackRef} count={models.length} tone="light" /> : null}
    </div>
  );
}
