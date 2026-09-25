import Image from "next/image";
import Link from "next/link";
import type { CmsWheelModel } from "@/lib/cms/types";
import { metaLine, toForgedWheelView } from "./forgedView";
import styles from "./ForgedCatalog.module.css";

const BASE_PATH = "/shop/wheels/forged";

export function ForgedCatalog({ models }: { models: CmsWheelModel[] }) {
  const wheelViews = models.flatMap((model) => {
    const view = toForgedWheelView(model);
    return view ? [view] : [];
  });

  return (
    <div className={styles.page}>
      <section className={styles.hero} data-shop-chrome-tone="dark">
        <div className={styles.heroInner}>
          <p className={styles.kicker}>BIZON Forged</p>
          <h1>Пять характеров.<br />{" "}Одна точность.</h1>
          <p className={styles.lead}>
            Кованые диски BIZON изготавливаются под заказ. Выберите дизайн — специалист
            проверит параметры автомобиля и возможность конфигурации.
          </p>
        </div>
      </section>

      <section className={styles.catalog} data-shop-chrome-tone="light" aria-labelledby="forged-models-title">
        <div className={styles.inner}>
          <div className={styles.sectionHead}>
            <p className={styles.kicker}>Коллекция</p>
            <h2 id="forged-models-title">Выберите дизайн</h2>
          </div>
          <div className={styles.grid}>
            {wheelViews.map((view, index) => (
              <Link
                className={`${styles.card} ${index === 0 || index === 3 ? styles.cardWide : ""}`}
                href={`${BASE_PATH}/${view.slug}`}
                key={view.id}
              >
                <div className={styles.media}>
                  <Image
                    src={view.heroImage}
                    alt={view.name}
                    fill
                    sizes={index === 0 || index === 3 ? "(max-width: 760px) 92vw, 66vw" : "(max-width: 760px) 92vw, 34vw"}
                    priority={index < 2}
                  />
                </div>
                <div className={styles.cardContent}>
                  <span>Изготавливается под заказ</span>
                  <strong>{view.name}</strong>
                  <p>{metaLine(view)}</p>
                </div>
                <span className={styles.arrow} aria-hidden="true">↗</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.cta} data-shop-chrome-tone="dark">
        <div className={styles.ctaInner}>
          <div>
            <p className={styles.darkKicker}>Индивидуальная конфигурация</p>
            <h2>Дизайн — начало подбора</h2>
            <p>Размер, вылет, разболтовка и покрытие подтверждаются после проверки автомобиля.</p>
          </div>
          <Link href="/contact?subject=wheel-selection" className={styles.ctaLink}>Подобрать диски</Link>
        </div>
      </section>
    </div>
  );
}
