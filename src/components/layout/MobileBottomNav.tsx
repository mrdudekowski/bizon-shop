"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ClipboardList, Compass, Grid2X2, House, ShoppingBag, Store, Wrench } from "lucide-react";
import styles from "./MobileBottomNav.module.css";

type NavItem = {
  href: string;
  label: string;
  icon: typeof House;
  matches: (pathname: string) => boolean;
};

const MAIN_ITEMS: NavItem[] = [
  { href: "/", label: "Главная", icon: House, matches: (path) => path === "/" },
  { href: "/models", label: "Каталог", icon: Grid2X2, matches: (path) => path.startsWith("/models") },
  { href: "/tire-iq", label: "Tire IQ", icon: Compass, matches: (path) => path.startsWith("/tire-iq") },
  { href: "/cart", label: "Заявка", icon: ClipboardList, matches: (path) => path === "/cart" },
];

const SHOP_ITEMS: NavItem[] = [
  { href: "/shop", label: "Shop", icon: Store, matches: (path) => path === "/shop" },
  { href: "/shop/categories", label: "Категории", icon: Grid2X2, matches: (path) => path === "/shop/categories" || (path.startsWith("/shop/") && !path.startsWith("/shop/wheels") && path !== "/shop/cart" && path !== "/shop/delivery-and-returns") },
  { href: "/shop/wheels/forged", label: "Подбор", icon: Wrench, matches: (path) => path.startsWith("/shop/wheels") },
  { href: "/shop/cart", label: "Корзина", icon: ShoppingBag, matches: (path) => path === "/shop/cart" },
];

type MobileBottomNavProps = { context: "main" | "shop"; cartCount: number };

export function MobileBottomNav({ context, cartCount }: MobileBottomNavProps) {
  const pathname = usePathname();
  const items = context === "shop" ? SHOP_ITEMS : MAIN_ITEMS;

  return (
    <nav className={styles.nav} aria-label={context === "shop" ? "Основная навигация BIZON Shop" : "Основная навигация BIZON Tires"}>
      {items.map(({ href, label, icon: Icon, matches }) => {
        const active = matches(pathname);
        const isCart = label === "Заявка" || label === "Корзина";
        return (
          <Link key={label} className={styles.item} href={href} aria-current={active ? "page" : undefined}>
            <span className={styles.iconWrap}>
              <Icon aria-hidden="true" className={styles.icon} strokeWidth={active ? 2.3 : 1.8} />
              {isCart && cartCount > 0 ? <span className={styles.badge}>{cartCount > 9 ? "9+" : cartCount}</span> : null}
            </span>
            <span className={active ? styles.labelActive : styles.label}>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
