"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";

import { CartHeaderButton } from "@/components/cart/CartHeaderButton";
import { ChromeNavIcon } from "@/components/chrome/ChromeNavIcon";
import { ChromeWordmark, FloatingChrome } from "@/components/chrome/FloatingChrome";
import { useAdaptiveChrome } from "@/components/chrome/useAdaptiveChrome";
import { SiteArrow } from "@/components/SiteArrow/SiteArrow";
import { ROUTES } from "@/constants/navigation";
import { shopCategoryCarouselIconUrl, shopCategoryIconUrl } from "@/lib/content/shopCategoryPresentation";

import styles from "./ShopChrome.module.css";

function CatalogGridIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="3" y="3" width="7.5" height="7.5" rx="1.2" />
      <rect x="13.5" y="3" width="7.5" height="7.5" rx="1.2" />
      <rect x="3" y="13.5" width="7.5" height="7.5" rx="1.2" />
      <rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1.2" />
    </svg>
  );
}

export function ShopChrome({ menuOpen, onMenuToggle, cartCount, onCartOpen, categoryMarks = [] }) {
  const [iconsOpen, setIconsOpen] = useState(false);
  const [mobile, setMobile] = useState(false);
  const [veryWide, setVeryWide] = useState(false);
  const rootRef = useRef(null);
  const categoryMarksRef = useRef(null);
  const mobileCatalogToggleRef = useRef(null);
  const wideCatalogToggleRef = useRef(null);
  const { tone } = useAdaptiveChrome("data-shop-chrome-tone", "dark");
  const mobileMarks = categoryMarks.filter((mark) => mark.iconUrl || shopCategoryIconUrl(mark.slug));
  const showCategoryMarks = (mobile || veryWide) && iconsOpen;

  useEffect(() => {
    const mobileQuery = window.matchMedia("(max-width: 767px)");
    const veryWideQuery = window.matchMedia("(min-width: 1600px)");
    const sync = () => {
      setMobile(mobileQuery.matches);
      setVeryWide(veryWideQuery.matches);
      setIconsOpen(false);
    };
    sync();
    mobileQuery.addEventListener("change", sync);
    veryWideQuery.addEventListener("change", sync);
    return () => {
      mobileQuery.removeEventListener("change", sync);
      veryWideQuery.removeEventListener("change", sync);
    };
  }, []);

  useEffect(() => {
    if (menuOpen) setIconsOpen(false);
  }, [menuOpen]);

  function renderMarkIcon(mark) {
    const icon = mark.iconUrl || (tone === "dark" ? shopCategoryCarouselIconUrl(mark.slug) : shopCategoryIconUrl(mark.slug));
    return icon ? (
      <Image
        className={styles.categoryIcon}
        src={icon}
        alt=""
        data-tone={tone}
        width={28}
        height={28}
        unoptimized
      />
    ) : mark.label;
  }

  useEffect(() => {
    if (!iconsOpen) return undefined;
    const restoreCatalogFocus = () => {
      const toggle = veryWide ? wideCatalogToggleRef.current : mobileCatalogToggleRef.current;
      toggle?.focus();
    };
    const closeFromScroll = () => {
      if (categoryMarksRef.current?.contains(document.activeElement)) restoreCatalogFocus();
      setIconsOpen(false);
    };
    const closeFromPointer = (event) => {
      if (rootRef.current?.contains(event.target)) return;
      setIconsOpen(false);
    };
    const closeFromEscape = (event) => {
      if (event.key === "Escape") {
        setIconsOpen(false);
        restoreCatalogFocus();
      }
    };
    window.addEventListener("scroll", closeFromScroll, { passive: true });
    document.addEventListener("pointerdown", closeFromPointer);
    document.addEventListener("keydown", closeFromEscape);
    return () => {
      window.removeEventListener("scroll", closeFromScroll);
      document.removeEventListener("pointerdown", closeFromPointer);
      document.removeEventListener("keydown", closeFromEscape);
    };
  }, [iconsOpen, veryWide]);

  return (
    <FloatingChrome
      ariaLabel="Навигация BIZON Shop"
      menuOpen={menuOpen}
      onMenuToggle={onMenuToggle}
      rootRef={rootRef}
      brand={(
        <span
          className={styles.brandSlot}
          data-icons={showCategoryMarks ? "true" : "false"}
          style={{ "--mark-count": mobileMarks.length }}
        >
          <Link
            className={styles.wordmarkLink}
            href="/shop"
            aria-label="BIZON Shop — на главную"
            aria-hidden={showCategoryMarks || undefined}
            tabIndex={showCategoryMarks ? -1 : undefined}
          >
            <ChromeWordmark />
          </Link>
          <span
            ref={categoryMarksRef}
            id="shop-category-marks"
            className={styles.categoryMarks}
            aria-hidden={showCategoryMarks ? undefined : true}
          >
            {mobileMarks.map((mark, index) => {
              return (
                <Link
                  key={mark.href}
                  href={mark.href}
                  aria-label={mark.label}
                  data-tooltip={mark.label}
                  tabIndex={showCategoryMarks ? undefined : -1}
                  onClick={() => setIconsOpen(false)}
                  style={{ "--mark-index": index }}
                >
                  {renderMarkIcon(mark)}
                </Link>
              );
            })}
          </span>
        </span>
      )}
      startNavigation={
        <>
          <Link data-shop-catalog-link href="/shop/categories" onClick={() => setIconsOpen(false)}>
            <ChromeNavIcon name="catalog" />
            <span>Каталог</span>
          </Link>
          <button
            type="button"
            className={styles.wideCatalogToggle}
            ref={wideCatalogToggleRef}
            data-shop-catalog-toggle
            aria-expanded={iconsOpen}
            aria-controls="shop-category-marks"
            aria-label={iconsOpen ? "Скрыть категории магазина" : "Открыть каталог магазина"}
            onClick={() => setIconsOpen((open) => !open)}
          >
            <ChromeNavIcon name="catalog" />
            <span>Каталог</span>
          </button>
          <Link href="/shop/wheels/forged" onClick={() => setIconsOpen(false)}>
            <ChromeNavIcon name="disk" />
            <span>Диски</span>
          </Link>
        </>
      }
      navigation={
        <>
          <Link data-shop-request href="/contact?subject=wheel-selection">
            Заявка
          </Link>
          <Link href={ROUTES.shopDelivery} onClick={() => setIconsOpen(false)}>
            <ChromeNavIcon name="delivery" />
            <span>Доставка</span>
          </Link>
        </>
      }
      utility={(
        <Link href="/" onClick={() => setIconsOpen(false)}>
          <span className={styles.desktopHomeIcon}><ChromeNavIcon name="home" /></span>
          <span>BIZON</span>
          <SiteArrow direction="ne" className={styles.compactHomeArrow} />
        </Link>
      )}
      action={(
        <>
          <button
            type="button"
            className={styles.mobileCatalogToggle}
            ref={mobileCatalogToggleRef}
            aria-expanded={iconsOpen}
            aria-label={iconsOpen ? "Скрыть категории" : "Категории"}
            onClick={() => setIconsOpen((open) => !open)}
          >
            <CatalogGridIcon />
            <span>Каталог</span>
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
