"use client";

import Link from "next/link";
import { CartHeaderButton } from "@/components/cart/CartHeaderButton";
import { ChromeWordmark, FloatingChrome } from "@/components/chrome/FloatingChrome";
import { SiteArrow } from "@/components/SiteArrow/SiteArrow";

export function ShopChrome({ menuOpen, onMenuToggle, cartCount, onCartOpen }) {
  return (
    <FloatingChrome
      ariaLabel="Навигация BIZON Shop"
      menuOpen={menuOpen}
      onMenuToggle={onMenuToggle}
      brand={
        <Link href="/shop" aria-label="BIZON Shop — на главную">
          <ChromeWordmark />
        </Link>
      }
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
      action={<CartHeaderButton count={cartCount} onOpen={onCartOpen} />}
      toneAttribute="data-shop-chrome-tone"
      fallbackTone="dark"
      surface="shop"
    />
  );
}
