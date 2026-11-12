"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import type { HomeShopCarouselItem } from "@/lib/content/homeShopCarousel";
import styles from "./HomeShopIconCarousel.module.css";

const ITEM_INTERVAL_MS = 6000;

export function HomeShopIconCarousel({ items }: { items: HomeShopCarouselItem[] }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);
  const count = items.length;
  const activeItem = items[activeIndex] ?? items[0];

  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updatePreference = () => setReducedMotion(preference.matches);
    updatePreference();
    preference.addEventListener("change", updatePreference);
    return () => preference.removeEventListener("change", updatePreference);
  }, []);

  useEffect(() => {
    if (reducedMotion || count < 2) return undefined;
    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % count);
    }, ITEM_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [count, reducedMotion]);

  if (!activeItem) return null;

  return (
    <div className={styles.carousel} data-reduced-motion={reducedMotion ? "true" : undefined}>
      <div key={activeItem.id} className={styles.iconTile} role="img" aria-label={activeItem.title}>
        <Image src={activeItem.iconUrl} alt="" aria-hidden width={96} height={96} unoptimized data-home-shop-icon="" />
      </div>
      <p key={`${activeItem.id}-caption`} className={styles.caption}>{activeItem.caption}</p>
    </div>
  );
}
