"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { PageHeader } from "@/components/catalog/PageHeader";
import { WheelModelGrid } from "@/components/catalog/WheelModelGrid";
import { WheelTypeCover } from "@/components/catalog/WheelTypeCover";
import type { CmsWheelModel, CmsWheelType, CmsWheelVariant } from "@/lib/content/types";
import { fetchBrowserPublishedJson, fetchBrowserPublishedList } from "@/lib/content/browserPublishedClient";

import styles from "./ForgedCatalog.module.css";

const BASE_PATH = "/shop/wheels/forged";

export function ForgedCatalog({
  wheelType: initialWheelType,
  models: initialModels,
  variants: initialVariants,
}: {
  wheelType: CmsWheelType;
  models: CmsWheelModel[];
  variants: CmsWheelVariant[];
}) {
  const [wheelType, setWheelType] = useState(initialWheelType);
  const [models, setModels] = useState(initialModels);
  const [variants, setVariants] = useState(initialVariants);

  useEffect(() => {
    const controller = new AbortController();
    void Promise.all([
      fetchBrowserPublishedJson<CmsWheelType>("/v1/wheels/types/forged", controller.signal),
      fetchBrowserPublishedList<CmsWheelModel>("/v1/wheels/types/forged/models", controller.signal),
      fetchBrowserPublishedList<CmsWheelVariant>("/v1/wheels/types/forged/variants", controller.signal),
    ]).then(([publishedType, publishedModels, publishedVariants]) => {
      if (controller.signal.aborted) return;
      setWheelType(publishedType);
      setModels(publishedModels);
      setVariants(publishedVariants);
    }).catch((error: unknown) => {
      if (!controller.signal.aborted) console.warn("Could not refresh published forged wheel catalog; showing generated content.", error);
    });
    return () => controller.abort();
  }, []);

  const headerDescription = wheelType.shortDescription || wheelType.description;

  return (
    <div className={styles.page} data-shop-chrome-tone="light">
      <div className={styles.inner}>
        <PageHeader
          title={wheelType.name || "BIZON Forged"}
          description={headerDescription}
          breadcrumbs={[
            { href: "/", label: "Главная" },
            { href: "/shop", label: "Магазин" },
            { href: BASE_PATH, label: "Кованые диски" },
          ]}
        />
        <WheelTypeCover imageUrl={wheelType.imageUrl} name={wheelType.name} />
        {wheelType.shortDescription && wheelType.description && (
          <p className="section-description">{wheelType.description}</p>
        )}

        <section className={styles.catalog} aria-labelledby="forged-models-title">
          <div className={styles.sectionHead}>
            <p className={styles.kicker}>Коллекция</p>
            <h2 id="forged-models-title">Выберите дизайн</h2>
          </div>
          <WheelModelGrid
            models={models}
            variants={variants}
            typeBasePath={BASE_PATH}
          />
        </section>

        <section className={styles.cta} aria-labelledby="forged-cta-title">
          <div>
            <p className={styles.darkKicker}>Индивидуальная конфигурация</p>
            <h2 id="forged-cta-title">Дизайн — начало подбора</h2>
            <p>Размер, вылет, разболтовка и покрытие подтверждаются после проверки автомобиля.</p>
          </div>
          <Link href="/contact?subject=wheel-selection" className={styles.ctaLink}>
            Проверить совместимость дисков
          </Link>
        </section>
      </div>
    </div>
  );
}
