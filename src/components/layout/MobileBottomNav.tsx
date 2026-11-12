"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ROUTES } from "@/constants/navigation";
import styles from "./MobileBottomNav.module.css";

const SHOP_CATEGORY_EXCLUDED_PATHS = new Set<string>([
  ROUTES.shopCart,
  ROUTES.shopDeliveryAndReturns,
  ROUTES.shopDelivery,
  ROUTES.shopPayment,
  ROUTES.shopWarranty,
  ROUTES.shopSupplier,
]);

type NavIcon = "home" | "catalog" | "compass" | "tire" | "request";

const ICON_CLASS: Record<NavIcon, string> = {
  home: styles.iconHome,
  catalog: styles.iconCatalog,
  compass: styles.iconCompass,
  tire: styles.iconTire,
  request: styles.iconRequest,
};

type NavItem = {
  href: string;
  label: string;
  icon: NavIcon;
  matches: (pathname: string) => boolean;
};

const MAIN_ITEMS: NavItem[] = [
  { href: "/", label: "Главная", icon: "home", matches: (path) => path === "/" },
  { href: "/models", label: "Каталог", icon: "catalog", matches: (path) => path.startsWith("/models") },
  { href: "/tire-iq", label: "Tire IQ", icon: "compass", matches: (path) => path.startsWith("/tire-iq") },
  { href: "/cart", label: "Заявка", icon: "request", matches: (path) => path === "/cart" },
];

const SHOP_ITEMS: NavItem[] = [
  { href: "/shop", label: "Главная", icon: "home", matches: (path) => path === "/shop" },
  { href: "/shop/categories", label: "Каталог", icon: "catalog", matches: (path) => {
    const normalized = path.length > 1 && path.endsWith("/") ? path.slice(0, -1) : path;
    return normalized === "/shop/categories" || (normalized.startsWith("/shop/") && !normalized.startsWith("/shop/wheels") && !normalized.startsWith("/shop/product") && !SHOP_CATEGORY_EXCLUDED_PATHS.has(normalized));
  } },
  { href: "/shop/wheels/forged", label: "Диски", icon: "tire", matches: (path) => path.startsWith("/shop/wheels") },
  { href: "/shop/cart", label: "Заявка", icon: "request", matches: (path) => path === "/shop/cart" },
];

type MobileBottomNavProps = { context: "main" | "shop"; cartCount: number };

export function MobileBottomNav({ context, cartCount }: MobileBottomNavProps) {
  const pathname = usePathname();
  const items = context === "shop" ? SHOP_ITEMS : MAIN_ITEMS;

  return (
    <nav className={styles.nav} aria-label={context === "shop" ? "Основная навигация BIZON Shop" : "Основная навигация BIZON Tires"}>
      {items.map(({ href, label, icon, matches }) => {
        const active = matches(pathname);
        const isRequest = icon === "request";
        return (
          <Link key={label} className={styles.item} href={href} aria-current={active ? "page" : undefined}>
            <span className={styles.iconWrap}>
              <span aria-hidden="true" className={`${styles.icon} ${ICON_CLASS[icon]} ${active ? styles.iconActive : ""}`} />
              {isRequest && cartCount > 0 ? <span className={styles.badge}>{cartCount > 9 ? "9+" : cartCount}</span> : null}
            </span>
            <span className={active ? styles.labelActive : styles.label}>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
