"use client";

import Link from "next/link";

import { CartHeaderButton } from "@/components/cart/CartHeaderButton";
import { FloatingChrome } from "@/components/chrome/FloatingChrome";
import { ROUTES } from "@/constants/navigation";

type MainChromeProps = {
  menuOpen: boolean;
  onMenuToggle(open: boolean): void;
  cartCount: number;
  onCartOpen(): void;
};

export function MainChrome({
  menuOpen,
  onMenuToggle,
  cartCount,
  onCartOpen,
}: MainChromeProps) {
  return (
    <FloatingChrome
      ariaLabel="Навигация BIZON Tires"
      menuOpen={menuOpen}
      onMenuToggle={onMenuToggle}
      brand={
        <Link href={ROUTES.home} aria-label="Bizon Tires — на главную" translate="no">
          BIZON
        </Link>
      }
      navigation={
        <>
          <Link href="/#solutions">Решения</Link>
          <Link href={ROUTES.models}>Каталог</Link>
          <Link href={ROUTES.tireIq}>Tire IQ</Link>
        </>
      }
      action={<CartHeaderButton count={cartCount} onOpen={onCartOpen} />}
      toneAttribute="data-main-chrome-tone"
      fallbackTone="dark"
      surface="main"
    />
  );
}
