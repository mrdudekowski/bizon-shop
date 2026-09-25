import Image from "next/image";
import Link from "next/link";
import { ShopCategoryCarousel } from "@/components/shop/ShopCategoryCarousel";
import {
  SHOP_CATEGORY_SLIDES,
  SHOP_HOME_WHEEL_SLUGS,
  SHOP_ORDER_STEPS,
  SHOP_VEHICLE_STORIES,
} from "@/constants/shopHome";
import { getWheelModelsByTypeSlug } from "@/lib/cms";
import { createPageMetadata } from "@/lib/seo/metadata";
import styles from "./ShopHome.module.css";

export const metadata = createPageMetadata({
  title: "BIZON Shop",
  description: "Кованые диски BIZON под заказ, аксессуары и outdoor-товары.",
  path: "/shop",
});

export default async function ShopPage() {
  const forgedModels = await getWheelModelsByTypeSlug("forged");
  const forgedModelsBySlug = new Map(forgedModels.map((model) => [model.slug, model]));
  const homeModels = SHOP_HOME_WHEEL_SLUGS
    .map((slug) => forgedModelsBySlug.get(slug))
    .filter((model): model is NonNullable<typeof model> => Boolean(model?.imageUrl));

  return (
    <div className={styles.page}>
      <section className={styles.hero} data-shop-chrome-tone="dark">
        <div className={styles.heroMedia}>
          <Image
            src="/images/premium/shop-hero-forged-wheel-model.png"
            alt="Кованый диск BIZON и модель в красном образе"
            fill
            priority
            sizes="100vw"
          />
        </div>
        <div className={styles.heroOverlay} />
        <div className={styles.heroContent}>
          <p className={styles.eyebrow}>BIZON Forged</p>
          <h1>Кованые диски для вашего автомобиля</h1>
          <p className={styles.heroLead}>Выберите дизайн — параметры и совместимость проверит специалист BIZON.</p>
          <Link className={styles.heroAction} href="#wheels">Выбрать диски</Link>
        </div>
      </section>

      <section className={styles.modelsSection} id="wheels" data-shop-chrome-tone="dark" aria-labelledby="shop-title">
        <div className={styles.content}>
          <div className={styles.modelsIntro}>
            <p className={styles.collectionKicker}>BIZON Forged</p>
            <h2 id="shop-title">Выберите свой дизайн</h2>
            <p>Кованые диски BIZON изготавливаются под заказ. Выберите модель — специалист проверит совместимость с вашим автомобилем.</p>
          </div>

          <div className={styles.modelGrid}>
            {homeModels.map((model) => (
              <Link className={styles.modelCard} href={`/shop/wheels/forged/${model.slug}`} key={model.slug}>
                <span className={styles.modelMedia}>
                  <Image src={model.imageUrl!} alt={model.name} fill sizes="(max-width: 767px) 92vw, 33vw" />
                </span>
                <span className={styles.modelContent}>
                  <span className={styles.modelStatus}>Изготавливается под заказ</span>
                  <strong>{model.name}</strong>
                  <span>{[model.designStyle, model.series].filter(Boolean).join(" · ")}</span>
                </span>
                <span className={styles.modelArrow} aria-hidden="true">↗</span>
              </Link>
            ))}
          </div>

          <div className={styles.orderSteps} aria-label="Как заказать кованые диски BIZON">
            {SHOP_ORDER_STEPS.map((step, index) => (
              <article key={step.title}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <h2>{step.title}</h2>
                <p>{step.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <div id="categories" data-shop-chrome-tone="dark">
        <ShopCategoryCarousel slides={SHOP_CATEGORY_SLIDES} />
      </div>

      <section className={styles.vehiclesSection} data-shop-section="vehicles" data-shop-chrome-tone="light" aria-labelledby="vehicles-title">
        <div className={styles.vehiclesInner}>
          <div className={styles.vehiclesHead}>
            <div>
              <p className={styles.darkKicker}>BIZON Forged</p>
              <h2 id="vehicles-title">Созданы менять характер</h2>
              <p>Один автомобиль — разные ощущения. Дизайн BIZON подчёркивает стиль от городского premium до экспедиционного off-road.</p>
            </div>
            <Link className={styles.selectionAction} href="#wheels">Выбрать диски</Link>
          </div>

          <div className={styles.vehicleGrid}>
            {SHOP_VEHICLE_STORIES.map((story, index) => (
              <figure className={index < 2 ? styles.vehicleFeature : styles.vehicleCard} key={story.image}>
                <Image src={story.image} alt={story.alt} fill sizes={index < 2 ? "(max-width: 767px) 100vw, 50vw" : "(max-width: 767px) 100vw, 33vw"} />
                <figcaption>{story.title}</figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
