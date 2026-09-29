import Link from "next/link";

import { SiteArrow } from "@/components/SiteArrow/SiteArrow";
import { SHOP_LIFESTYLE_CATEGORIES } from "@/constants/shopCategories";
import { ShopResponsiveImage } from "./ShopResponsiveImage";
import styles from "./ShopCategoriesIndex.module.css";

export function ShopCategoriesIndex() {
  return (
    <div className={styles.page}>
      <section className={styles.hero} data-shop-chrome-tone="dark">
        <div className={styles.inner}>
          <nav className={styles.breadcrumbs} aria-label="Хлебные крошки">
            <Link href="/shop">Shop</Link>
            <span aria-hidden="true">/</span>
            <span>Категории</span>
          </nav>
          <p className={styles.kicker}>BIZON Shop</p>
          <h1>Движение продолжается вне автомобиля</h1>
          <p className={styles.lead}>Два направления для дороги и остановок за пределами привычного маршрута.</p>
        </div>
      </section>

      <section className={styles.catalog} data-shop-chrome-tone="light" aria-labelledby="shop-categories-title">
        <div className={styles.inner}>
          <div className={styles.sectionHead}>
            <p className={styles.lightKicker}>Категории</p>
            <h2 id="shop-categories-title">Выберите направление</h2>
          </div>
          <div className={styles.grid}>
            {SHOP_LIFESTYLE_CATEGORIES.map((category) => (
              <Link className={styles.card} href={`/shop/${category.slug}`} key={category.slug}>
                <ShopResponsiveImage
                  className={styles.media}
                  desktopSrc={category.desktopImage}
                  mobileSrc={category.mobileImage}
                  alt={category.imageAlt}
                  sizes="(max-width: 639px) 100vw, 50vw"
                />
                <span className={styles.overlay} aria-hidden="true" />
                <span className={styles.cardContent}>
                  <span>{category.kicker}</span>
                  <strong>{category.title}</strong>
                  <span className={styles.arrow} aria-hidden="true"><SiteArrow direction="ne" /></span>
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
