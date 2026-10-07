"use client";

import { SiteArrow } from "@/components/SiteArrow/SiteArrow";
import { CatalogImage } from "@/components/catalog/CatalogImage";
import { cardSubtitle, formatAxleLabels } from "@/lib/catalog/featuredAssortment";
import { getModelApplicationValues } from "@/lib/catalog/tireCategories";
import type { TireCatalogModel } from "@/lib/catalog/tireReadModel";
import Link from "next/link";

import styles from "./MainHome.module.css";

export function AssortmentCarousel({ models }: { models: TireCatalogModel[] }) {
  if (models.length === 0) return null;

  return (
    <div className={styles.assortmentTrack} aria-label="Ключевые модели шин">
      {models.map((model) => {
        const iconApplications = model.selectionAxles.length === 1
          ? []
          : getModelApplicationValues(model).filter((value) => value === "long_haul" || value === "regional");
        const applicationLabels: Record<string, string> = {
          long_haul: "Магистральные",
          regional: "Региональные",
        };
        const subtitle = cardSubtitle(model);
        const remainingSubtitle = iconApplications.length > 0
          ? subtitle.split(" · ").filter((label) => !iconApplications.some((value) => applicationLabels[value] === label)).join(" · ")
          : subtitle;

        return (
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
              <span className={styles.assortmentStatus}>
                {iconApplications.map((value) => (
                  <img
                    key={value}
                    className={styles.assortmentApplicationIcon}
                    src={`/images/application/${value === "long_haul" ? "long-haul" : "regional"}-m.svg`}
                    alt={applicationLabels[value]}
                    title={applicationLabels[value]}
                    width={28}
                    height={28}
                  />
                ))}
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
      })}
    </div>
  );
}
