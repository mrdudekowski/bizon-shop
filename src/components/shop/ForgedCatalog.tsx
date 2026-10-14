import Link from "next/link";

import { PageHeader } from "@/components/catalog/PageHeader";
import { WheelModelGrid } from "@/components/catalog/WheelModelGrid";
import type { CmsWheelModel, CmsWheelVariant } from "@/lib/content/types";

import styles from "./ForgedCatalog.module.css";

const BASE_PATH = "/shop/wheels/forged";

export function ForgedCatalog({
  models,
  variants,
}: {
  models: CmsWheelModel[];
  variants: CmsWheelVariant[];
}) {
  return (
    <div className={styles.page} data-shop-chrome-tone="light">
      <div className={styles.inner}>
        <PageHeader
          title="BIZON Forged"
          description="Характеры. Одна точность. Кованые диски BIZON изготавливаются под заказ. Выберите дизайн — специалист проверит параметры автомобиля и возможность конфигурации."
          breadcrumbs={[
            { href: "/", label: "Главная" },
            { href: "/shop", label: "Магазин" },
            { href: BASE_PATH, label: "Кованые диски" },
          ]}
        />

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
