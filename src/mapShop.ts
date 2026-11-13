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
  image_focal_x?: number | null;
  image_focal_y?: number | null;
  image_focal_by_viewport?: Partial<Record<"desktop" | "tablet" | "mobile", { x: number; y: number }>> | null;
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
  imageFocalX?: number;
  imageFocalY?: number;
  imageFocalByViewport?: Partial<Record<"desktop" | "tablet" | "mobile", { x: number; y: number }>>;
};

export type CmsShopCategory = {
  id: string;
  slug: string;
  name: string;
  description: string;
  imageUrl: string | null;
  imageFocalX?: number;
  imageFocalY?: number;
  imageFocalByViewport?: Partial<Record<"desktop" | "tablet" | "mobile", { x: number; y: number }>>;
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
  imageFocalX?: number;
  imageFocalY?: number;
  imageFocalByViewport?: Partial<Record<"desktop" | "tablet" | "mobile", { x: number; y: number }>>;
};

export type CmsImageFocal = {
  focalX?: number;
  focalY?: number;
  focalByViewport?: Partial<Record<"desktop" | "tablet" | "mobile", { x: number; y: number }>>;
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
  imageFocalX?: number;
  imageFocalY?: number;
  imageFocalByViewport?: Partial<Record<"desktop" | "tablet" | "mobile", { x: number; y: number }>>;
  gallery: string[];
  galleryFocals?: (CmsImageFocal | null)[];
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
  slides: { media_id?: string | null; title?: string | null; image_url?: string | null; image_focal_x?: number; image_focal_y?: number; image_focal_by_viewport?: Partial<Record<"desktop" | "tablet" | "mobile", { x: number; y: number }>> | null }[] = [],
): CmsShopCategory {
  return {
    id: String(row.id),
    slug: row.slug,
    name: row.name,
    description: row.description ?? "",
    imageUrl: normalizeImageUrl(row.image_url),
    ...(typeof row.image_focal_x === "number" ? { imageFocalX: row.image_focal_x } : {}),
    ...(typeof row.image_focal_y === "number" ? { imageFocalY: row.image_focal_y } : {}),
    ...(row.image_focal_by_viewport ? { imageFocalByViewport: row.image_focal_by_viewport } : {}),
    showInMenu: row.show_in_menu === true,
    sortOrder: sortOrder(row.sort_order),
    ...(optionalText(row.seo_seo_title) ? { seoTitle: row.seo_seo_title ?? undefined } : {}),
    ...(optionalText(row.seo_seo_description) ? { seoDescription: row.seo_seo_description ?? undefined } : {}),
    carousel: slides.slice(0, 1).map((slide) => ({
      title: slide.title ?? "",
      imageUrl: normalizeImageUrl(slide.image_url),
      ...(typeof slide.image_focal_x === "number" ? { imageFocalX: slide.image_focal_x } : {}),
      ...(typeof slide.image_focal_y === "number" ? { imageFocalY: slide.image_focal_y } : {}),
      ...(slide.image_focal_by_viewport ? { imageFocalByViewport: slide.image_focal_by_viewport } : {}),
    })),
  };
}

export function mapShopVariant(row: ShopVariantRow, images: string[] = [], focal?: { x?: number; y?: number; byViewport?: Partial<Record<"desktop" | "tablet" | "mobile", { x: number; y: number }>> }): CmsProductVariant {
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
    ...(typeof focal?.x === "number" ? { imageFocalX: focal.x } : {}),
    ...(typeof focal?.y === "number" ? { imageFocalY: focal.y } : {}),
    ...(focal?.byViewport ? { imageFocalByViewport: focal.byViewport } : {}),
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
  mainFocal?: { x?: number; y?: number; byViewport?: Partial<Record<"desktop" | "tablet" | "mobile", { x: number; y: number }>> },
  galleryFocals?: CmsProduct["galleryFocals"],
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
    ...(typeof mainFocal?.x === "number" ? { imageFocalX: mainFocal.x } : {}),
    ...(typeof mainFocal?.y === "number" ? { imageFocalY: mainFocal.y } : {}),
    ...(mainFocal?.byViewport ? { imageFocalByViewport: mainFocal.byViewport } : {}),
    gallery: gallery.filter((url) => !url.startsWith("data:")),
    ...(galleryFocals ? { galleryFocals } : {}),
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
