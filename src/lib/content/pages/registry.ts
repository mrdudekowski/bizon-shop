import type { PageKey } from "./keys";
import { PAGE_KEYS } from "./keys";

export type PageRegistryEntry = {
  key: PageKey;
  title: string;
  path: string;
};

export const PAGE_REGISTRY: readonly PageRegistryEntry[] = [
  { key: "home", title: "Главная Bizon", path: "/" },
  { key: "shop-home", title: "Главная Shop", path: "/shop" },
  { key: "about", title: "О компании", path: "/about" },
  { key: "contact", title: "Контакты", path: "/contact" },
  { key: "warranty", title: "Гарантия и возврат", path: "/warranty" },
  { key: "branding", title: "Брендирование", path: "/branding" },
  {
    key: "become-a-supplier",
    title: "Стать поставщиком",
    path: "/become-a-supplier",
  },
  { key: "delivery-geography", title: "География поставок", path: "/delivery-geography" },
  { key: "privacy-policy", title: "Политика конфиденциальности", path: "/privacy-policy" },
  {
    key: "shop-delivery-returns",
    title: "Оплата, доставка и возврат",
    path: "/shop/delivery-and-returns",
  },
  { key: "delivery", title: "Доставка", path: "/delivery" },
  { key: "payment", title: "Оплата", path: "/payment" },
  { key: "shop-delivery", title: "Доставка", path: "/shop/delivery" },
  { key: "shop-payment", title: "Оплата", path: "/shop/payment" },
  { key: "shop-warranty", title: "Гарантия и возврат", path: "/shop/warranty" },
  { key: "shop-become-a-supplier", title: "Стать поставщиком", path: "/shop/become-a-supplier" },
] as const;

export const PAGE_KEY_OPTIONS = PAGE_REGISTRY.map((entry) => ({
  label: entry.title,
  value: entry.key,
}));

export function getPageRegistryEntry(key: PageKey): PageRegistryEntry {
  const entry = PAGE_REGISTRY.find((item) => item.key === key);
  if (!entry) throw new Error(`Unknown page key: ${key}`);
  return entry;
}

export function assertAllKeysRegistered(): void {
  for (const key of PAGE_KEYS) {
    getPageRegistryEntry(key);
  }
}
