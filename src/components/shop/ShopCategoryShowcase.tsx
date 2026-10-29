"use client";

import { ShopCategoryCarousel } from "@/components/shop/ShopCategoryCarousel";
import type { ShopHomeCarouselSlide } from "@/lib/content/shopCategoryPresentation";
import styles from "./ShopCategoryShowcase.module.css";

export function ShopCategoryShowcase({
  slides,
}: {
  slides: readonly ShopHomeCarouselSlide[];
  cards?: unknown;
}) {
  return (
    <div className={styles.root}>
      <h2 id="categories-title" className={styles.visuallyHidden}>
        Категории товаров
      </h2>
      <div className={styles.stage}>
        <ShopCategoryCarousel slides={slides} />
      </div>
    </div>
  );
}
