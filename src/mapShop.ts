import { lexicalToHtml, normalizeImageUrl, toFiniteNumber } from "./mapTire";

type ShopCategoryRow = {
  id: string | number;
  name: string;
  slug: string;
  description: string | null;
  show_in_menu: boolean | null;
  sort_order: unknown;
  image_url: string | null;
  seo_seo_title?: string | null;
  seo_seo_description?: string | null;
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
  sku?: string | null;
  brand?: string | null;
  sort_order?: unknown;
  specifications?: unknown;
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
  subcategory_slug?: string | null;
  subcategory_name?: string | null;
  seo_seo_title?: string | null;
  seo_seo_description?: string | null;
};

export type CmsShopCategoryCarouselFrame = {
  title: string;
  imageUrl: string | null;
};

export type CmsShopCategory = {
  id: string;
  slug: string;
  name: string;
  description: string;
  imageUrl: string | null;
  showInMenu: boolean;
  sortOrder: number;
  seoTitle?: string;
  seoDescription?: string;
  carousel: CmsShopCategoryCarouselFrame[];
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

export type CmsProductSpec = {
  label: string;
  value: string;
};

export type CmsProduct = {
  id: string;
  slug: string;
  name: string;
  sku?: string;
  categorySlug: string;
  subcategorySlug?: string;
  subcategoryName?: string;
  type: string;
  brand: string;
  sortOrder?: number;
  specifications?: CmsProductSpec[];
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
  seoTitle?: string;
  seoDescription?: string;
  variants: CmsProductVariant[];
};

function optionalText(value: string | null | undefined): string | undefined {
  return value && value.trim() ? value : undefined;
}

function sortOrder(value: unknown): number {
  return toFiniteNumber(value) ?? 0;
}

export function mapShopCategory(
  row: ShopCategoryRow,
  slides: { title?: string | null; image_url?: string | null }[] = [],
): CmsShopCategory {
  return {
    id: String(row.id),
    slug: row.slug,
    name: row.name,
    description: row.description ?? "",
    imageUrl: normalizeImageUrl(row.image_url),
    showInMenu: row.show_in_menu === true,
    sortOrder: sortOrder(row.sort_order),
    ...(optionalText(row.seo_seo_title) ? { seoTitle: row.seo_seo_title ?? undefined } : {}),
    ...(optionalText(row.seo_seo_description) ? { seoDescription: row.seo_seo_description ?? undefined } : {}),
    carousel: slides.slice(0, 1).map((slide) => ({
      title: slide.title ?? "",
      imageUrl: normalizeImageUrl(slide.image_url),
    })),
  };
}

export function mapShopVariant(row: ShopVariantRow, images: string[] = []): CmsProductVariant {
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
    images: images.filter((image) => !image.startsWith("data:")),
  };
}

function parseProductSpecs(raw: unknown): CmsProductSpec[] {
  if (!Array.isArray(raw)) return [];
  return raw.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const label = typeof (item as { label?: unknown }).label === "string" ? (item as { label: string }).label.trim() : "";
    const value = typeof (item as { value?: unknown }).value === "string" ? (item as { value: string }).value.trim() : "";
    return label && value ? [{ label, value }] : [];
  });
}

export function mapShopProduct(
  row: ShopProductRow,
  imageUrl: string | null | undefined,
  gallery: string[],
  variants: CmsProductVariant[],
): CmsProduct {
  const price = toFiniteNumber(row.price);
  const oldPrice = toFiniteNumber(row.old_price);
  const specs = parseProductSpecs(row.specifications);
  return {
    id: String(row.id),
    slug: row.slug,
    name: row.name,
    ...(optionalText(row.sku) ? { sku: row.sku ?? undefined } : {}),
    categorySlug: row.category_slug,
    ...(row.subcategory_slug ? { subcategorySlug: row.subcategory_slug } : {}),
    ...(row.subcategory_name ? { subcategoryName: row.subcategory_name } : {}),
    type: "",
    brand: optionalText(row.brand) ?? "",
    sortOrder: sortOrder(row.sort_order),
    ...(specs.length > 0 ? { specifications: specs } : {}),
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
    ...(optionalText(row.seo_seo_title) ? { seoTitle: row.seo_seo_title ?? undefined } : {}),
    ...(optionalText(row.seo_seo_description) ? { seoDescription: row.seo_seo_description ?? undefined } : {}),
    variants,
  };
}
