"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { SiteArrow } from "@/components/SiteArrow/SiteArrow";
import { ShopCategoryCarousel } from "@/components/shop/ShopCategoryCarousel";
import type { ShopHomeCarouselSlide, ShopHomeCategoryCard } from "@/lib/content/shopCategoryPresentation";
import styles from "./ShopCategoryShowcase.module.css";

type View = "carousel" | "cards";

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

function FramesIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="2" y="5" width="15" height="14" rx="2" />
      <rect x="18.6" y="7.5" width="1.7" height="9" rx="0.8" />
      <rect x="21.4" y="9.5" width="1.4" height="5" rx="0.7" />
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
  const [view, setView] = useState<View>("carousel");
  const [visible, setVisible] = useState<View>("carousel");
  const [leaving, setLeaving] = useState(false);
  const timer = useRef<number | undefined>(undefined);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  function toggleView() {
    const next: View = view === "carousel" ? "cards" : "carousel";
    const raw = rootRef.current
      ? getComputedStyle(rootRef.current).getPropertyValue("--showcase-switch")
      : "0";
    const switchMs = Number.parseFloat(raw);
    setView(next);
    window.clearTimeout(timer.current);
    if (!Number.isFinite(switchMs) || switchMs <= 0) {
      setVisible(next);
      setLeaving(false);
      return;
    }
    setLeaving(true);
    timer.current = window.setTimeout(() => {
      setVisible(next);
      setLeaving(false);
    }, switchMs);
  }

  const showingCards = view === "cards";

  return (
    <div className={styles.root} ref={rootRef}>
      <h2 id="categories-title" className={styles.visuallyHidden}>
        Категории товаров
      </h2>
      <button
        type="button"
        className={styles.toggle}
        aria-pressed={showingCards}
        aria-label={showingCards ? "Показать карусель" : "Показать карточки"}
        onClick={toggleView}
      >
        <span className={styles.toggleIcon} data-icon={showingCards ? "frames" : "grid"}>
          <GridIcon />
          <FramesIcon />
        </span>
      </button>
      <div className={styles.stage} data-phase={leaving ? "out" : "in"}>
        {visible === "carousel" ? (
          <ShopCategoryCarousel slides={slides} />
        ) : (
          <div className={styles.band}>
            <ul className={styles.grid}>
              {cards.map((card) => (
                <li key={card.slug}>
                  <Link className={styles.card} href={card.href}>
                    <span className={styles.iconFrame}>
                      {card.iconUrl ? (
                        <Image src={card.iconUrl} alt="" width={280} height={180} className={styles.icon} />
                      ) : null}
                    </span>
                    <span className={styles.cardTitle}>{card.title}</span>
                    <span className={styles.cardArrow} aria-hidden="true">
                      <SiteArrow direction="ne" />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
