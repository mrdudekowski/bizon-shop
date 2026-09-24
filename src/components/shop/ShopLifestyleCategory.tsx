import Link from "next/link";

import { ShopProductCard } from "@/components/shop/ShopProductCard";
import type { ShopLifestyleCategory } from "@/constants/shopCategories";
import { SHOP_LIFESTYLE_CATEGORIES } from "@/constants/shopCategories";
import type { CmsProduct } from "@/lib/content/types";
import { ShopResponsiveImage } from "./ShopResponsiveImage";
import styles from "./ShopLifestyleCategory.module.css";

type ShopLifestyleCategoryProps = {
  category: ShopLifestyleCategory;
  products: CmsProduct[];
};

export function ShopLifestyleCategoryPage({ category, products }: ShopLifestyleCategoryProps) {
  const sibling = SHOP_LIFESTYLE_CATEGORIES.find((item) => item.slug !== category.slug);

  return (
    <div className={styles.page}>
      <section className={styles.hero} data-shop-chrome-tone="dark">
        <ShopResponsiveImage
          className={styles.heroMedia}
          desktopSrc={category.desktopImage}
          mobileSrc={category.mobileImage}
          alt={category.imageAlt}
          priority
        />
        <div className={styles.heroOverlay} aria-hidden="true" />
        <div className={styles.heroContent}>
          <nav className={styles.breadcrumbs} aria-label="Хлебные крошки">
            <Link href="/shop">Shop</Link>
            <span aria-hidden="true">/</span>
            <Link href="/shop/categories">Категории</Link>
          </nav>
          <p className={styles.kicker}>{category.kicker}</p>
          <h1>{category.title}</h1>
          <p className={styles.lead}>{category.description}</p>
          <a className={styles.heroAction} href="#collection">Смотреть коллекцию</a>
        </div>
      </section>

      <section className={styles.intro} data-shop-chrome-tone="light" aria-labelledby={`${category.slug}-approach`}>
        <div className={styles.inner}>
          <div className={styles.sectionHead}>
            <p className={styles.lightKicker}>Подход BIZON</p>
            <h2 id={`${category.slug}-approach`}>Вещи с понятным сценарием</h2>
          </div>
          <div className={styles.principles}>
            {category.principles.map((principle) => (
              <article key={principle.label}>
                <span>{principle.label}</span>
                <h3>{principle.title}</h3>
                <p>{principle.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.collection} id="collection" data-shop-chrome-tone="light" aria-labelledby={`${category.slug}-collection`}>
        <div className={styles.inner}>
          <div className={styles.collectionHead}>
            <div>
              <p className={styles.lightKicker}>Коллекция</p>
              <h2 id={`${category.slug}-collection`}>{category.kicker}</h2>
            </div>
            <p>Товары и доступные варианты появятся здесь после финального отбора коллекции.</p>
          </div>

          {products.length > 0 ? (
            <div className={styles.productGrid}>
              {products.map((product) => (
                <ShopProductCard key={product.slug} product={product} />
              ))}
            </div>
          ) : (
            <div className={styles.emptyState}>
              <p className={styles.emptyLabel}>Коллекция готовится</p>
              <h3>Первые позиции скоро появятся</h3>
              <p>Завершаем отбор ассортимента, вариантов и изображений. Оставьте контакт, если хотите узнать о запуске раньше.</p>
              <Link href="/contact" className={styles.contactLink}>Сообщить об интересе</Link>
            </div>
          )}
        </div>
      </section>

      {sibling ? (
        <section className={styles.nextCategory} data-shop-chrome-tone="dark">
          <ShopResponsiveImage
            className={styles.nextMedia}
            desktopSrc={sibling.desktopImage}
            mobileSrc={sibling.mobileImage}
            alt=""
          />
          <div className={styles.nextOverlay} aria-hidden="true" />
          <div className={styles.nextContent}>
            <p>Следующая категория</p>
            <h2>{sibling.kicker}</h2>
            <Link href={`/shop/${sibling.slug}`}>Открыть {sibling.kicker}</Link>
          </div>
        </section>
      ) : null}
    </div>
  );
}
