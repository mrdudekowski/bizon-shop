"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { CartHeaderButton } from "@/components/cart/CartHeaderButton";
import { ChromeWordmark, FloatingChrome } from "@/components/chrome/FloatingChrome";
import { useAdaptiveChrome } from "@/components/chrome/useAdaptiveChrome";
import { SiteArrow } from "@/components/SiteArrow/SiteArrow";
import { shopCategoryCarouselIconUrl, shopCategoryIconUrl } from "@/lib/content/shopCategoryPresentation";

import styles from "./ShopChrome.module.css";

export function ShopChrome({ menuOpen, onMenuToggle, cartCount, onCartOpen, categoryMarks = [] }) {
  const [iconsOpen, setIconsOpen] = useState(false);
  const [mobile, setMobile] = useState(false);
  const rootRef = useRef(null);
  const { tone } = useAdaptiveChrome("data-shop-chrome-tone", "dark");
  const marks = categoryMarks.filter((mark) => shopCategoryIconUrl(mark.slug));
  const showMarks = mobile && iconsOpen;

  useEffect(() => {
    const query = window.matchMedia("(max-width: 767px)");
    const sync = () => {
      setMobile(query.matches);
      if (!query.matches) setIconsOpen(false);
    };
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (!iconsOpen) return undefined;
    const closeFromScroll = () => setIconsOpen(false);
    const closeFromPointer = (event) => {
      if (rootRef.current?.contains(event.target)) return;
      setIconsOpen(false);
    };
    window.addEventListener("scroll", closeFromScroll, { passive: true });
    document.addEventListener("pointerdown", closeFromPointer);
    return () => {
      window.removeEventListener("scroll", closeFromScroll);
      document.removeEventListener("pointerdown", closeFromPointer);
    };
  }, [iconsOpen]);

  return (
    <FloatingChrome
      ariaLabel="Навигация BIZON Shop"
      menuOpen={menuOpen}
      onMenuToggle={onMenuToggle}
      rootRef={rootRef}
      brand={showMarks ? (
        <span className={styles.categoryMarks}>
          {marks.map((mark) => {
            const icon = tone === "dark" ? shopCategoryCarouselIconUrl(mark.slug) : shopCategoryIconUrl(mark.slug);
            return (
              <Link key={mark.href} href={mark.href} aria-label={mark.label}>
                {icon ? <img src={icon} alt="" /> : mark.label}
              </Link>
            );
          })}
        </span>
      ) : (
        <Link href="/shop" aria-label="BIZON Shop — на главную">
          <ChromeWordmark />
        </Link>
      )}
      startNavigation={
        <>
          <Link href="/shop/categories">Каталог</Link>
          <Link href="/shop/wheels/forged">Диски</Link>
        </>
      }
      navigation={
        <>
          <Link href="/contact?subject=wheel-selection">Заявка</Link>
          <Link href="/shop/delivery-and-returns">Возврат</Link>
        </>
      }
      utility={<Link href="/">BIZON <SiteArrow direction="ne" /></Link>}
      action={(
        <>
          <button
            type="button"
            className={styles.catalogToggle}
            aria-expanded={iconsOpen}
            aria-label={iconsOpen ? "Скрыть категории" : "Категории"}
            onClick={() => setIconsOpen((open) => !open)}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <rect x="3" y="3" width="7.5" height="7.5" rx="1.2" />
              <rect x="13.5" y="3" width="7.5" height="7.5" rx="1.2" />
              <rect x="3" y="13.5" width="7.5" height="7.5" rx="1.2" />
              <rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1.2" />
            </svg>
          </button>
          <span className={styles.cartSlot}>
            <CartHeaderButton count={cartCount} onOpen={onCartOpen} />
          </span>
        </>
      )}
      toneAttribute="data-shop-chrome-tone"
      fallbackTone="dark"
      surface="shop"
    />
  );
}
