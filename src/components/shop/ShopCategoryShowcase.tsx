"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ShopCategoryCarousel } from "@/components/shop/ShopCategoryCarousel";
import type { ShopHomeCarouselSlide, ShopHomeCategoryCard } from "@/lib/content/shopCategoryPresentation";
import styles from "./ShopCategoryShowcase.module.css";

function GridIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="3" y="3" width="7.5" height="7.5" rx="1.6" />
      <rect x="13.5" y="3" width="7.5" height="7.5" rx="1.6" />
      <rect x="3" y="13.5" width="7.5" height="7.5" rx="1.6" />
      <rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1.6" />
    </svg>
  );
}

export function ShopCategoryShowcase({
  slides,
  cards,
}: {
  slides: readonly ShopHomeCarouselSlide[];
  cards: readonly ShopHomeCategoryCard[];
}) {
  const [iconsOpen, setIconsOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root || typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(([entry]) => {
      if (entry && !entry.isIntersecting && entry.boundingClientRect.bottom <= 0) {
        setIconsOpen(false);
      }
    });

    observer.observe(root);
    return () => observer.disconnect();
  }, []);

  return (
    <div className={styles.root} ref={rootRef}>
      <h2 id="categories-title" className={styles.visuallyHidden}>
        Категории товаров
      </h2>
      <div className={styles.controls}>
        <nav
          id="shop-category-shortcuts"
          className={styles.iconRail}
          data-open={iconsOpen}
          aria-label="Категории товаров"
          aria-hidden={!iconsOpen}
          inert={!iconsOpen}
        >
          {cards.map((card) => (
            <Link
              key={card.slug}
              className={styles.iconLink}
              href={card.href}
              aria-label={card.title}
              title={card.title}
            >
              {card.iconUrl ? (
                <Image src={card.iconUrl} alt="" width={28} height={28} className={styles.iconImage} />
              ) : (
                <span className={styles.iconFallback} aria-hidden="true">
                  {card.title.trim().charAt(0)}
                </span>
              )}
              <span className={styles.iconLabel}>{card.title}</span>
            </Link>
          ))}
        </nav>
        <button
          type="button"
          className={styles.toggle}
          aria-expanded={iconsOpen}
          aria-controls="shop-category-shortcuts"
          aria-label={iconsOpen ? "Скрыть категории" : "Все категории"}
          onClick={() => setIconsOpen((open) => !open)}
        >
          <span className={styles.toggleIcon}>
            <GridIcon />
          </span>
          <span className={styles.toggleLabel}>Все категории</span>
        </button>
      </div>
      <div className={styles.stage}>
        <ShopCategoryCarousel slides={slides} />
      </div>
    </div>
  );
}
