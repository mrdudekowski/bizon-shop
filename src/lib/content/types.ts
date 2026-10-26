/** Public CMS shapes consumed by pages and SEO helpers — keep stable when swapping data sources. */

import type {
  CatalogAxle,
} from "@/lib/selection/options";

export type CmsProductSpec = {
  label: string;
  value: string;
};

export type CmsProduct = {
  id?: string;
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
  imageUrl?: string | null;
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

export type CmsShopCategoryCarouselFrame = {
  title: string;
  imageUrl?: string | null;
};

export type CmsShopCategory = {
  slug: string;
  name: string;
  description: string;
  imageUrl?: string | null;
  showInMenu: boolean;
  sortOrder: number;
  seoTitle?: string;
  seoDescription?: string;
  carousel?: CmsShopCategoryCarouselFrame[];
};

export type CmsTireType = {
  slug: string;
  name: string;
  description: string;
  shortDescription: string;
  sortOrder: number;
  showInMenu: boolean;
  imageUrl?: string | null;
  seoTitle?: string;
  seoDescription?: string;
};

export type CmsTireAdvantage = {
  key: string;
  title: string;
  description?: string;
};

export type CmsTireDocument = {
  url: string;
  title: string;
};

export type CmsTireModel = {
  id: string;
  slug: string;
  name: string;
  tireTypeSlug: string;
  tireTypeName: string;
  applicationTypes: string[];
  brand: string;
  descriptionShort: string;
  descriptionLong: string;
  imageUrl?: string | null;
  application?: string;
  axlePosition?: string;
  treadType?: string;
  gallery: string[];
  advantages: CmsTireAdvantage[];
  documents: CmsTireDocument[];
  selectionAxles: CatalogAxle[];
  available?: boolean;
  showInMenu: boolean;
  menuOrder: number;
  seoTitle?: string;
  seoDescription?: string;
};

export type CmsTireVariant = {
  id: string;
  size: string;
  rimDiameter?: number;
  loadIndex?: string;
  loadIndexDual?: string;
  speedIndex?: string;
  plyRating?: string;
  overallDiameter?: number;
  sectionWidth?: number;
  treadDepth?: number;
  pressureSingleKpa?: number;
  pressureDualKpa?: number;
  maxLoadSingleKg?: number;
  maxLoadDualKg?: number;
  recommendedRim?: string;
  available: boolean;
  price?: number;
  priceOnRequest: boolean;
};

export type TireModelRouteParam = {
  tireTypeSlug: string;
  modelSlug: string;
};

export type CmsArticle = {
  slug: string;
  title: string;
  excerpt: string;
  publishedAt: string;
  /** HTML string or future rich-text JSON — render with LexicalContent on detail pages. */
  content: unknown;
  imageUrl?: string | null;
  imageConfigured?: boolean;
  showInMenu: boolean;
  menuOrder: number;
  taxonomy?: string[];
};

export type WheelModelRouteParam = {
  wheelTypeSlug: string;
  modelSlug: string;
};

export type CmsWheelType = {
  slug: string;
  name: string;
  description: string;
  shortDescription: string;
  sortOrder: number;
  imageUrl?: string | null;
  seoTitle?: string;
  seoDescription?: string;
};

export type CmsWheelGalleryImage = {
  url: string;
  alt: string;
  label: string;
};

export type CmsWheelModel = {
  id: string;
  slug: string;
  name: string;
  wheelTypeSlug: string;
  wheelTypeName: string;
  series?: string;
  designStyle?: string;
  material?: string;
  constructionMethod?: string;
  fitmentNotes?: string;
  descriptionShort: string;
  descriptionLong: string;
  imageUrl?: string | null;
  gallery: CmsWheelGalleryImage[];
  documents?: { url: string; title: string }[];
  available?: boolean;
  showInMenu: boolean;
  menuOrder: number;
  seoTitle?: string;
  seoDescription?: string;
};

export type CmsWheelVariant = {
  id: string;
  modelId: string;
  sizeLabel: string;
  sku?: string;
  diameter?: number;
  width?: number;
  boltHoles?: number;
  pcd?: string;
  pcdMm?: number;
  offsetET?: number;
  centerBore?: number;
  loadRating?: string;
  weight?: number;
  color?: string;
  finish?: string;
  fastenerType?: string;
  fastenerMaterial?: string;
  sourceSpecification?: string;
  compatibleTireSizes?: string;
  available: boolean;
  price?: number;
  priceOnRequest: boolean;
};

export type GetShopProductsOptions = {
  categorySlug?: string;
};
