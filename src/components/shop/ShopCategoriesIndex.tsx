import Link from "next/link";

import { SiteArrow } from "@/components/SiteArrow/SiteArrow";
import { shopCategoryIndexCards } from "@/lib/content/shopCategoryPresentation";
import type { CmsShopCategory } from "@/lib/content/types";
import type { ShopHomePageContent } from "@/lib/content/pages/types";
import { ShopResponsiveImage } from "./ShopResponsiveImage";
import styles from "./ShopCategoriesIndex.module.css";

export function ShopCategoriesIndex({
  categories,
  catalog,
}: {
  categories: readonly CmsShopCategory[];
  catalog: ShopHomePageContent["catalog"];
}) {
  const cards = shopCategoryIndexCards(categories, catalog.tiles);

  return (
    <div className={styles.page}>
      <section className={styles.hero} data-shop-chrome-tone="dark">
        <div className={styles.inner}>
          <nav className={styles.breadcrumbs} aria-label="Хлебные крошки">
            <Link href="/shop">Shop</Link>
            <span aria-hidden="true">/</span>
            <span>Категории</span>
          </nav>
          <p className={styles.kicker}>{catalog.copy.eyebrow}</p>
          <h1>{catalog.copy.title}</h1>
          <p className={styles.lead}>{catalog.copy.lead}</p>
        </div>
      </section>

      <section className={styles.catalog} data-shop-chrome-tone="light" aria-labelledby="shop-categories-title">
        <div className={styles.inner}>
          <div className={styles.sectionHead}>
            <p className={styles.lightKicker}>Категории</p>
            <h2 id="shop-categories-title">{catalog.copy.sectionTitle}</h2>
          </div>
          {cards.length > 0 ? (
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
          ) : (
            <p className={styles.empty}>Категории пока не опубликованы. Загляните сюда позже.</p>
          )}
        </div>
      </section>
    </div>
  );
}
