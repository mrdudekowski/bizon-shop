import { lexicalToHtml, normalizeImageUrl, toFiniteNumber } from "./mapTire";

type ShopCategoryRow = {
  name: string;
  slug: string;
  description: string | null;
  show_in_menu: boolean | null;
  sort_order: unknown;
  image_url: string | null;
};

type ShopVariantRow = {
  id: string | number;
  sku: string | null;
  color: string | null;
  size: string | null;
  configuration: string | null;
  price: unknown;
  old_price: unknown;
  price_on_request: boolean | null;
  available: boolean | null;
};

type ShopProductRow = {
  id: string | number;
  name: string;
  slug: string;
  short_description: string | null;
  full_description: unknown;
  price: unknown;
  old_price: unknown;
  price_on_request: boolean | null;
  available: boolean | null;
  color: string | null;
  size: string | null;
  material: string | null;
  category_slug: string;
};

export type CmsShopCategory = {
  slug: string;
  name: string;
  description: string;
  imageUrl: string | null;
  showInMenu: boolean;
  sortOrder: number;
};

export type CmsProductVariant = {
  id: string;
  sku?: string;
  color?: string;
  size?: string;
  configuration?: string;
  price?: number;
  oldPrice?: number;
  priceOnRequest: boolean;
  available: boolean;
  images: string[];
};

export type CmsProduct = {
  id: string;
  slug: string;
  name: string;
  categorySlug: string;
  type: string;
  brand: string;
  descriptionShort: string;
  descriptionLong: string;
  imageUrl: string | null;
  gallery: string[];
  price?: number;
  oldPrice?: number;
  priceOnRequest: boolean;
  available: boolean;
  color?: string;
  size?: string;
  material?: string;
  variants: CmsProductVariant[];
};

function optionalText(value: string | null | undefined): string | undefined {
  return value && value.trim() ? value : undefined;
}

function sortOrder(value: unknown): number {
  return toFiniteNumber(value) ?? 0;
}

export function mapShopCategory(row: ShopCategoryRow): CmsShopCategory {
  return {
    slug: row.slug,
    name: row.name,
    description: row.description ?? "",
    imageUrl: normalizeImageUrl(row.image_url),
    showInMenu: row.show_in_menu === true,
    sortOrder: sortOrder(row.sort_order),
  };
}

export function mapShopVariant(row: ShopVariantRow): CmsProductVariant {
  const price = toFiniteNumber(row.price);
  const oldPrice = toFiniteNumber(row.old_price);
  return {
    id: String(row.id),
    ...(optionalText(row.sku) ? { sku: row.sku ?? undefined } : {}),
    ...(optionalText(row.color) ? { color: row.color ?? undefined } : {}),
    ...(optionalText(row.size) ? { size: row.size ?? undefined } : {}),
    ...(optionalText(row.configuration) ? { configuration: row.configuration ?? undefined } : {}),
    ...(price !== undefined ? { price } : {}),
    ...(oldPrice !== undefined ? { oldPrice } : {}),
    priceOnRequest: price === undefined || row.price_on_request === true,
    available: row.available !== false,
    images: [],
  };
}

export function mapShopProduct(
  row: ShopProductRow,
  imageUrl: string | null | undefined,
  gallery: string[],
  variants: CmsProductVariant[],
): CmsProduct {
  const price = toFiniteNumber(row.price);
  const oldPrice = toFiniteNumber(row.old_price);
  return {
    id: String(row.id),
    slug: row.slug,
    name: row.name,
    categorySlug: row.category_slug,
    type: "",
    brand: "",
    descriptionShort: row.short_description ?? "",
    descriptionLong: lexicalToHtml(row.full_description),
    imageUrl: normalizeImageUrl(imageUrl),
    gallery: gallery.filter((url) => !url.startsWith("data:")),
    ...(price !== undefined ? { price } : {}),
    ...(oldPrice !== undefined ? { oldPrice } : {}),
    priceOnRequest: price === undefined || row.price_on_request === true,
    available: row.available !== false,
    ...(optionalText(row.color) ? { color: row.color ?? undefined } : {}),
    ...(optionalText(row.size) ? { size: row.size ?? undefined } : {}),
    ...(optionalText(row.material) ? { material: row.material ?? undefined } : {}),
    variants,
  };
}
