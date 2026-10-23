import Link from "next/link";

import { PageHeader } from "@/components/catalog/PageHeader";
import { WheelModelGrid } from "@/components/catalog/WheelModelGrid";
import { WheelTypeCover } from "@/components/catalog/WheelTypeCover";
import type { CmsWheelModel, CmsWheelType, CmsWheelVariant } from "@/lib/content/types";

import styles from "./ForgedCatalog.module.css";

const BASE_PATH = "/shop/wheels/forged";

export function ForgedCatalog({
  wheelType,
  models,
  variants,
}: {
  wheelType: CmsWheelType;
  models: CmsWheelModel[];
  variants: CmsWheelVariant[];
}) {
  const fallbackDescription = "Пять дизайнов кованых дисков BIZON, изготавливаемых под заказ.";
  const headerDescription = wheelType.shortDescription || wheelType.description || fallbackDescription;

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
