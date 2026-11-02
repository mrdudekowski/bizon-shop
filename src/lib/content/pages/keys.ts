export const PAGE_KEYS = [
  "home",
  "shop-home",
  "about",
  "contact",
  "warranty",
  "branding",
  "become-a-supplier",
  "delivery-geography",
  "privacy-policy",
  "shop-delivery-returns",
  "delivery",
  "payment",
  "shop-delivery",
  "shop-payment",
  "shop-warranty",
  "shop-become-a-supplier",
] as const;

export type PageKey = (typeof PAGE_KEYS)[number];

export function isPageKey(value: unknown): value is PageKey {
  return typeof value === "string" && (PAGE_KEYS as readonly string[]).includes(value);
}
