import Image from "next/image";
import Link from "next/link";

import { ShopCategoryCarousel } from "@/components/shop/ShopCategoryCarousel";
import { shopCategoryIconUrl } from "@/lib/content/shopCategoryPresentation";
import type { ShopHomeCarouselSlide } from "@/lib/content/shopCategoryPresentation";
import { shopCategoryIndexCards } from "@/lib/content/shopCategoryPresentation";
import type { CmsShopCategory } from "@/lib/content/types";
import type { ShopHomePageContent } from "@/lib/content/pages/types";
import styles from "./ShopCategoriesIndex.module.css";

export function ShopCategoriesIndex({
  categories,
  catalog,
  slides,
}: {
  categories: readonly CmsShopCategory[];
  catalog: ShopHomePageContent["catalog"];
  slides: readonly ShopHomeCarouselSlide[];
}) {
  const cards = shopCategoryIndexCards(categories, catalog.tiles);

  return (
    <div className={styles.page}>
      <section className={styles.hero} data-shop-chrome-tone="dark">
        <ShopCategoryCarousel slides={slides} showSlideTitle={false}>
          <div className={styles.heroCopy}>
            <nav className={styles.breadcrumbs} aria-label="Хлебные крошки">
              <Link href="/shop">Shop</Link>
              <span aria-hidden="true">/</span>
              <span>Категории</span>
            </nav>
            <p className={styles.kicker}>{catalog.copy.eyebrow}</p>
            <h1>{catalog.copy.title}</h1>
            <p className={styles.lead}>{catalog.copy.lead}</p>
          </div>
        </ShopCategoryCarousel>
      </section>

      <section className={styles.catalog} data-shop-chrome-tone="light" aria-labelledby="shop-categories-title">
        <div className={styles.inner}>
          <div className={styles.sectionHead}>
            <p className={styles.lightKicker}>Категории</p>
            <h2 id="shop-categories-title">{catalog.copy.sectionTitle}</h2>
          </div>
          {cards.length > 0 ? (
            <div className={styles.grid}>
              {cards.map((category) => {
                const iconUrl = shopCategoryIconUrl(category.slug);
                return (
                  <Link className={styles.card} href={category.href} key={category.slug} aria-label={category.title}>
                    <span className={styles.iconFrame} aria-hidden="true">
                      {iconUrl ? (
                        <Image className={styles.icon} src={iconUrl} alt="" width={128} height={128} />
                      ) : (
                        <span className={styles.iconFallback}>{category.title.trim().charAt(0) || "?"}</span>
                      )}
                    </span>
                    <strong>{category.title}</strong>
                  </Link>
                );
              })}
            </div>
          ) : (
            <p className={styles.empty}>Категории пока не опубликованы. Загляните сюда позже.</p>
          )}
        </div>
      </section>
    </div>
  );
}
