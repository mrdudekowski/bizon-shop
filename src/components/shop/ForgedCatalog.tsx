"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

import { WheelModelGrid } from "@/components/catalog/WheelModelGrid";
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

  const title = wheelType.name || "BIZON Forged";
  const lead = wheelType.shortDescription || wheelType.description;
  const body =
    wheelType.shortDescription && wheelType.description && wheelType.description !== wheelType.shortDescription
      ? wheelType.description
      : "";
  const breadcrumbs = [
    { href: "/", label: "Главная" },
    { href: "/shop", label: "Магазин" },
    { href: BASE_PATH, label: "Кованые диски" },
  ];

  return (
    <div className={styles.page} data-shop-chrome-tone="light">
      <header className={styles.hero}>
        {wheelType.imageUrl ? (
          <div className={styles.heroMedia}>
            <Image
              src={wheelType.imageUrl}
              alt=""
              fill
              priority
              sizes="100vw"
            />
          </div>
        ) : null}
        <div className={styles.heroScrim} aria-hidden="true" />
        <nav aria-label="Breadcrumb" className={`${styles.heroCrumbs} breadcrumbs`}>
          <ol>
            {breadcrumbs.map((item, index) => (
              <li key={item.href}>
                {index === breadcrumbs.length - 1 ? (
                  <span aria-current="page">{item.label}</span>
                ) : (
                  <Link href={item.href}>{item.label}</Link>
                )}
                {index < breadcrumbs.length - 1 && <span aria-hidden="true">/</span>}
              </li>
            ))}
          </ol>
        </nav>
        <div className={styles.heroCopy}>
          <h1>{title}</h1>
          {lead ? <p className={styles.heroLead}>{lead}</p> : null}
          {body ? <p className={styles.heroBody}>{body}</p> : null}
        </div>
      </header>
      <div className={styles.inner}>
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
