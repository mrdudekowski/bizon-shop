"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

import { ShopCategoryCarousel } from "@/components/shop/ShopCategoryCarousel";
import { shopCategoryIconUrl, shopHomeCarouselSlides } from "@/lib/content/shopCategoryPresentation";
import { shopCategoryIndexCards } from "@/lib/content/shopCategoryPresentation";
import type { CmsShopCategory } from "@/lib/content/types";
import type { ShopHomePageContent } from "@/lib/content/pages/types";
import { getPageDefaults } from "@/lib/content/pages/defaults";
import { mergeShopHomeContent } from "@/lib/content/pages/merge";
import { fetchBrowserPublishedJson, fetchBrowserPublishedList } from "@/lib/content/browserPublishedClient";
import styles from "./ShopCategoriesIndex.module.css";

export function ShopCategoriesIndex({
  categories: initialCategories,
  catalog: initialCatalog,
}: {
  categories: readonly CmsShopCategory[];
  catalog: ShopHomePageContent["catalog"];
}) {
  const [categories, setCategories] = useState(initialCategories);
  const [catalog, setCatalog] = useState(initialCatalog);
  const slides = shopHomeCarouselSlides(categories, catalog.tiles);
  const cards = shopCategoryIndexCards(categories, catalog.tiles);

  useEffect(() => {
    const controller = new AbortController();
    void Promise.all([
      fetchBrowserPublishedJson<unknown>("/v1/pages/shop-home", controller.signal),
      fetchBrowserPublishedList<CmsShopCategory>("/v1/shop/categories", controller.signal),
    ]).then(([pagePatch, publishedCategories]) => {
      if (controller.signal.aborted || !pagePatch || typeof pagePatch !== "object" || Array.isArray(pagePatch)) return;
      const publishedPage = mergeShopHomeContent(
        getPageDefaults("shop-home"),
        pagePatch as Parameters<typeof mergeShopHomeContent>[1],
      );
      setCatalog(publishedPage.catalog);
      setCategories(publishedCategories);
    }).catch((error: unknown) => {
      if (!controller.signal.aborted) {
        console.warn("Could not refresh published Shop categories; showing the generated page.", error);
      }
    });
    return () => controller.abort();
  }, []);

  return (
    <div className={styles.page}>
      <section className={styles.hero} data-shop-chrome-tone="dark">
        <ShopCategoryCarousel slides={slides} showSlideTitle={false}>
          <div className={styles.heroCopy}>
            <nav className={styles.breadcrumbs} aria-label="Хлебные крошки">
              <Link href="/shop">Shop</Link>
              <span aria-hidden="true">/</span>
              <span aria-current="page">Категории</span>
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
