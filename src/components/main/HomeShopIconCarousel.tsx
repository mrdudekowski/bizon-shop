"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import type { HomeShopCarouselItem } from "@/lib/content/homeShopCarousel";
import styles from "./HomeShopIconCarousel.module.css";

const ITEM_INTERVAL_MS = 6000;

export function HomeShopIconCarousel({ items }: { items: HomeShopCarouselItem[] }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [transitionIndex, setTransitionIndex] = useState<number | null>(null);
  const [reducedMotion, setReducedMotion] = useState(false);
  const count = items.length;
  const activeItem = items[activeIndex] ?? items[0];
  const incomingItem = transitionIndex === null ? null : items[transitionIndex] ?? null;

  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updatePreference = () => setReducedMotion(preference.matches);
    updatePreference();
    preference.addEventListener("change", updatePreference);
    return () => preference.removeEventListener("change", updatePreference);
  }, []);

  useEffect(() => {
    if (reducedMotion || count < 2) return undefined;
    const timer = window.setTimeout(() => {
      setTransitionIndex((activeIndex + 1) % count);
    }, ITEM_INTERVAL_MS);
    return () => window.clearTimeout(timer);
  }, [activeIndex, count, reducedMotion]);

  useEffect(() => {
    if (!reducedMotion || transitionIndex === null) return;
    setActiveIndex(transitionIndex);
    setTransitionIndex(null);
  }, [reducedMotion, transitionIndex]);

  if (!activeItem) return null;

  const finishTransition = (index: number) => {
    setActiveIndex(index);
    setTransitionIndex(null);
  };

  return (
    <div className={styles.carousel} data-reduced-motion={reducedMotion ? "true" : undefined}>
      <div className={styles.iconTile} data-home-shop-icon-tile="" role="img" aria-label={activeItem.title}>
        <Image
          key={activeItem.id}
          className={`${styles.icon} ${incomingItem ? styles.iconExit : ""}`}
          src={activeItem.iconUrl}
          alt=""
          aria-hidden
          width={96}
          height={96}
          unoptimized
          data-home-shop-icon={incomingItem ? "outgoing" : "current"}
        />
        {incomingItem ? <Image
          key={incomingItem.id}
          className={`${styles.icon} ${styles.iconEnter}`}
          src={incomingItem.iconUrl}
          alt=""
          aria-hidden
          width={96}
          height={96}
          unoptimized
          data-home-shop-icon="incoming"
          onAnimationEnd={() => finishTransition(transitionIndex)}
        /> : null}
      </div>
      <div className={styles.captionSlot} aria-live="polite">
        <p
          key={`${activeItem.id}-caption`}
          className={`${styles.caption} ${incomingItem ? styles.captionExit : ""}`}
          data-home-shop-caption={incomingItem ? "outgoing" : "current"}
        >
          {activeItem.caption}
        </p>
        {incomingItem ? (
          <p
            key={`${incomingItem.id}-caption`}
            className={`${styles.caption} ${styles.captionEnter}`}
            data-home-shop-caption="incoming"
            aria-hidden="true"
          >
            {incomingItem.caption}
          </p>
        ) : null}
      </div>
    </div>
  );
}
