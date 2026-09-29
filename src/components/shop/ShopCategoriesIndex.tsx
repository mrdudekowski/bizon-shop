import Link from "next/link";

import { SiteArrow } from "@/components/SiteArrow/SiteArrow";
import { shopCategoryIndexCards } from "@/lib/content/shopCategoryPresentation";
import type { CmsShopCategory } from "@/lib/content/types";
import { ShopResponsiveImage } from "./ShopResponsiveImage";
import styles from "./ShopCategoriesIndex.module.css";

export function ShopCategoriesIndex({ categories }: { categories: readonly CmsShopCategory[] }) {
  const cards = shopCategoryIndexCards(categories);

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
          <p className={styles.lead}>Категории BIZON Shop — диски отдельно, товары по направлениям.</p>
        </div>
      </section>

      <section className={styles.catalog} data-shop-chrome-tone="light" aria-labelledby="shop-categories-title">
        <div className={styles.inner}>
          <div className={styles.sectionHead}>
            <p className={styles.lightKicker}>Категории</p>
            <h2 id="shop-categories-title">Выберите направление</h2>
          </div>
          <div className={styles.grid}>
            {cards.map((category) => (
              <Link className={styles.card} href={category.href} key={category.slug}>
                {category.desktopImage ? (
                  <ShopResponsiveImage
                    className={styles.media}
                    desktopSrc={category.desktopImage}
                    mobileSrc={category.mobileImage || category.desktopImage}
                    alt={category.imageAlt}
                    sizes="(max-width: 639px) 100vw, 50vw"
                  />
                ) : null}
                <span className={styles.overlay} aria-hidden="true" />
                <span className={styles.cardContent}>
                  {category.kicker ? <span className={styles.cardKicker}>{category.kicker}</span> : null}
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
