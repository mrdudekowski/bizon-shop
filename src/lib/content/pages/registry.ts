import type { PageKey } from "./keys";
import { PAGE_KEYS } from "./keys";

export type PageRegistryEntry = {
  key: PageKey;
  title: string;
  path: string;
  description?: string;
};

export const PAGE_REGISTRY: readonly PageRegistryEntry[] = [
  { key: "home", title: "Главная Bizon", path: "/" },
  { key: "shop-home", title: "Главная Shop", path: "/shop" },
  {
    key: "about",
    title: "О компании",
    path: "/about",
    description: "BIZON поставляет шины, диски и сопутствующие товары для коммерческого транспорта и спецтехники.",
  },
  { key: "contact", title: "Контакты", path: "/contact" },
  {
    key: "warranty",
    title: "Гарантия и возврат",
    path: "/warranty",
    description: "Как подать гарантийное обращение. Срок и объём условий подтверждает поставщик.",
  },
  {
    key: "branding",
    title: "Брендирование",
    path: "/branding",
    description: "Брендирование шин для спецтехники под торговую марку заказчика.",
  },
  {
    key: "become-a-supplier",
    title: "Стать поставщиком",
    path: "/become-a-supplier",
    description: "Диалог о поставках шин, дисков и комплектующих для профессиональной техники.",
  },
  { key: "delivery-geography", title: "География поставок", path: "/delivery-geography" },
  {
    key: "privacy-policy",
    title: "Политика конфиденциальности",
    path: "/privacy-policy",
    description: "Как BIZON обрабатывает персональные данные из заявок на сайте.",
  },
  {
    key: "shop-delivery-returns",
    title: "Оплата, доставка и возврат",
    path: "/shop/delivery-and-returns",
  },
  {
    key: "delivery",
    title: "Доставка",
    path: "/delivery",
    description: "Поставки по всей России. Срок и стоимость считаются по региону и объёму заказа.",
  },
  {
    key: "payment",
    title: "Оплата",
    path: "/payment",
    description: "Оплата на сайте не проводится. Способ согласуется при подтверждении заказа.",
  },
  {
    key: "shop-delivery",
    title: "Доставка BIZON Shop",
    path: "/shop/delivery",
    description: "Доставка заказа BIZON Shop. Срок зависит от региона, веса и состава груза.",
  },
  {
    key: "shop-payment",
    title: "Оплата BIZON Shop",
    path: "/shop/payment",
    description: "Заявка BIZON Shop. Наличие и цену подтверждает менеджер до сделки.",
  },
  {
    key: "shop-warranty",
    title: "Гарантия и возврат BIZON Shop",
    path: "/shop/warranty",
    description: "Возврат товара BIZON Shop оформляется через представителя BIZON.",
  },
  {
    key: "shop-become-a-supplier",
    title: "Поставщикам BIZON Shop",
    path: "/shop/become-a-supplier",
    description: "Диалог о поставках для ассортимента BIZON Shop.",
  },
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
