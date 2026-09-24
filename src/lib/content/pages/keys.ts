export const PAGE_KEYS = [
  "home",
  "shop-home",
  "about",
  "contact",
  "warranty",
  "branding",
  "become-a-supplier",
  "privacy-policy",
  "shop-delivery-returns",
] as const;

export type PageKey = (typeof PAGE_KEYS)[number];

export function isPageKey(value: unknown): value is PageKey {
  return typeof value === "string" && (PAGE_KEYS as readonly string[]).includes(value);
}
