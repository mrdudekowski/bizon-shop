export const REQUEST_ITEM_TYPES = [
  { label: "Шина", value: "tire" },
  { label: "Диск", value: "wheel" },
  { label: "Товар магазина", value: "shopProduct" },
] as const;

export type RequestItemType = (typeof REQUEST_ITEM_TYPES)[number]["value"];

export const SOURCE_FORMS = [
  { label: "Контакты", value: "contact" },
  { label: "Быстрый заказ товара", value: "product_quick_order" },
  { label: "Корзина", value: "cart" },
  { label: "Hero CTA", value: "hero_cta" },
  { label: "Footer CTA", value: "footer_cta" },
  { label: "Другое", value: "custom" },
] as const;

export type SourceForm = (typeof SOURCE_FORMS)[number]["value"];

export function isRequestItemType(value: unknown): value is RequestItemType {
  return typeof value === "string" && REQUEST_ITEM_TYPES.some((item) => item.value === value);
}

export function isSourceForm(value: unknown): value is SourceForm {
  return typeof value === "string" && SOURCE_FORMS.some((item) => item.value === value);
}

export type RequestItem = {
  itemType: RequestItemType;
  itemId: string;
  variantId?: string;
  name: string;
  slug: string;
  parentSlug?: string;
  quantity: number;
  price?: number;
  priceOnRequest: boolean;
  sourcePage?: string;
  image?: string;
  meta?: Record<string, string | number | boolean | null>;
};

export type RequestItemInput = {
  itemType?: RequestItemType | string | null;
  itemId?: string | number | null;
  variantId?: string | number | null;
  name?: string | null;
  slug?: string | null;
  parentSlug?: string | null;
  quantity?: number | null;
  price?: number | null;
  priceOnRequest?: boolean | null;
  url?: string | null;
  variantLabel?: string | null;
  notes?: string | null;
  meta?: Record<string, string | number | boolean | null> | null;
  /** @deprecated legacy shop quick order */
  title?: string | null;
  /** @deprecated legacy shop quick order */
  productId?: string | number | null;
  /** @deprecated use variantLabel */
  size?: string | null;
};
