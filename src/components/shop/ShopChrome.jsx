"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { CartHeaderButton } from "@/components/cart/CartHeaderButton";
import { FloatingChrome } from "@/components/chrome/FloatingChrome";
import styles from "./ShopChrome.module.css";

const CATEGORY_LINKS = [
  { href: "/shop/accessories", label: "Accessories" },
  { href: "/shop/outdoor", label: "Outdoor" },
  { href: "/shop/categories", label: "Все категории" },
];

export function ShopChrome({ menuOpen, onMenuToggle, cartCount, onCartOpen }) {
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const chromeRef = useRef(null);
  const categoryTriggerRef = useRef(null);
  const closeTimer = useRef(null);

  const cancelClose = () => {
    if (closeTimer.current) window.clearTimeout(closeTimer.current);
  };

  const scheduleClose = () => {
    cancelClose();
    closeTimer.current = window.setTimeout(() => setCategoriesOpen(false), 180);
  };

  useEffect(() => {
    const onPointerDown = (event) => {
      if (!chromeRef.current?.contains(event.target)) setCategoriesOpen(false);
    };
    const onKeyDown = (event) => {
      if (event.key === "Escape" && categoriesOpen) {
        setCategoriesOpen(false);
        categoryTriggerRef.current?.focus();
      }
    };

    document.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
      cancelClose();
    };
  }, [categoriesOpen]);

  return (
    <FloatingChrome
      ariaLabel="Навигация BIZON Shop"
      menuOpen={menuOpen}
      onMenuToggle={onMenuToggle}
      brand={<Link href="/shop" translate="no">BIZON SHOP</Link>}
      navigation={
        <>
          <Link href="/shop/categories">Каталог</Link>
          <Link href="/shop#wheels">Подобрать по параметрам</Link>
          <Link href="/shop/wheels/forged">Кованые диски</Link>
          <div
            className={styles.categoryMenu}
            onBlur={(event) => {
              if (!event.currentTarget.contains(event.relatedTarget)) setCategoriesOpen(false);
            }}
          >
            <button
              ref={categoryTriggerRef}
              className={`${styles.menuTrigger} ${categoriesOpen ? styles.menuTriggerActive : ""}`}
              type="button"
              aria-expanded={categoriesOpen}
              aria-controls="shop-category-menu"
              aria-haspopup="true"
              onClick={() => setCategoriesOpen((open) => !open)}
            >
              Категории
              <span className={styles.chevron} aria-hidden="true" />
            </button>
            {categoriesOpen ? (
              <div id="shop-category-menu" className={styles.dropdown} onMouseEnter={cancelClose}>
                {CATEGORY_LINKS.map((item) => (
                  <Link key={item.href} href={item.href} onClick={() => setCategoriesOpen(false)}>{item.label}</Link>
                ))}
              </div>
            ) : null}
          </div>
          <Link href="/contact?subject=wheel-selection">Заявка на диски</Link>
          <Link href="/shop/delivery-and-returns">Доставка и возврат</Link>
        </>
      }
      utility={<Link href="/">BIZON Tires ↗</Link>}
      action={<CartHeaderButton count={cartCount} onOpen={onCartOpen} />}
      toneAttribute="data-shop-chrome-tone"
      fallbackTone="dark"
      surface="shop"
      rootRef={chromeRef}
      onMouseLeave={scheduleClose}
    />
  );
}
