// Публичная форма карточки совпадает с main-app src/lib/content/types.ts.
// Код сайта сюда не импортируется.

import type { CatalogAxle, OperatingCondition, TireCategory, VehicleType } from "./options";

export type ImagePlacement = {
  assetId: string;
  alt: string;
  focalX: number;
  focalY: number;
  crop: { x: number; y: number; width: number; height: number };
};

export type DocumentLink = {
  assetId: string;
  title: string;
};

export type AdvantageItem = {
  id: string;
  title: string;
  description: string;
};

export type TireSizeDraft = {
  id: string;
  size: string;
  price?: number;
  priceOnRequest: boolean;
  available: boolean;
  sku?: string;
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
};

export type TireDirectionDraft = {
  id: string;
  name: string;
  slug: string;
  description: string;
  shortDescription: string;
  sortOrder: number;
  showInMenu: boolean;
  mainImage?: ImagePlacement;
  selectionVehicleTypes: VehicleType[];
  selectionConditions: OperatingCondition[];
};

export type TireModelDraft = {
  id: string;
  name: string;
  slug: string;
  directionId: string;
  mainImage?: ImagePlacement;
  gallery: ImagePlacement[];
  advantages: AdvantageItem[];
  documents: DocumentLink[];
  sizes: TireSizeDraft[];
  brand: string;
  descriptionShort: string;
  descriptionLong: string;
  applicationCategory: TireCategory | "";
  treadType: string;
  selectionVehicleTypes: VehicleType[];
  selectionConditions: OperatingCondition[];
  selectionAxles: CatalogAxle[];
  showInMenu: boolean;
  menuOrder: number;
};

export type PublishBlocker =
  | "name"
  | "slug"
  | "direction"
  | "mainImage"
  | "size"
  | "price"
  | "duplicateSize";

export type DocumentStatus = "draft" | "on_site" | "hidden";

export type AdminRole = "admin" | "editor";

export type AdminSession = {
  login: string;
  role: AdminRole;
};

/** Flat list row for pickers; document methods use EntityRecord<TireDirectionDraft>. */
export type TireDirection = {
  id: string;
  name: string;
  slug: string;
  status: DocumentStatus;
  hasUnpublishedDraft: boolean;
};

export type MediaAsset = {
  id: string;
  name: string;
  mimeType: string;
  dataUrl: string;
};

export type AdminUser = {
  id: string;
  login: string;
  role: AdminRole;
  disabled: boolean;
};

export type TireModelRecord = {
  id: string;
  draft: TireModelDraft;
  savedDraft: TireModelDraft | null;
  publishedSnapshot: TireModelDraft | null;
  hidden: boolean;
  slugLocked: boolean;
  lastSavedBy: string | null;
  lastPublishedBy: string | null;
};

export type WheelVariantDraft = {
  id: string;
  sizeLabel: string;
  pcd: string;
  offsetET?: number;
  centerBore?: number;
  color: string;
  price?: number;
  priceOnRequest: boolean;
  available: boolean;
};

export type WheelTypeDraft = {
  id: string;
  name: string;
  slug: string;
  description: string;
  mainImage?: ImagePlacement;
  sortOrder: number;
  showInMenu: boolean;
};

export type WheelModelDraft = {
  id: string;
  name: string;
  slug: string;
  wheelTypeId: string;
  series: string;
  material: string;
  constructionMethod: string;
  fitmentNotes: string;
  descriptionShort: string;
  descriptionLong: string;
  mainImage?: ImagePlacement;
  gallery: ImagePlacement[];
  documents: DocumentLink[];
  showInMenu: boolean;
  menuOrder: number;
  variants: WheelVariantDraft[];
};

export type ShopCategoryDraft = {
  id: string;
  name: string;
  slug: string;
  description: string;
  mainImage?: ImagePlacement;
  sortOrder: number;
  showInMenu: boolean;
};

export type ShopVariantDraft = {
  id: string;
  color: string;
  size: string;
  sku: string;
  price?: number;
  priceOnRequest: boolean;
  available: boolean;
  image?: ImagePlacement;
};

export type ShopProductDraft = {
  id: string;
  name: string;
  slug: string;
  categoryId: string;
  descriptionShort: string;
  descriptionLong: string;
  price?: number;
  priceOnRequest: boolean;
  mainImage?: ImagePlacement;
  gallery: ImagePlacement[];
  variants: ShopVariantDraft[];
};

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

export type PageCta = {
  label: string;
  href: string;
};

export type PageSectionCopy = {
  eyebrow: string;
  title: string;
  lead: string;
};

export type StubPageDraft = {
  id: Exclude<PageKey, "home" | "shop-home">;
  seoTitle: string;
  seoDescription: string;
  hero: PageSectionCopy & { image?: ImagePlacement };
};

export type HomePageDraft = {
  id: "home";
  seoTitle: string;
  seoDescription: string;
  hero: PageSectionCopy & {
    image?: ImagePlacement;
    primaryCta: PageCta;
    secondaryCta: PageCta;
    metricLabel: string;
    metricText: string;
  };
  selectionEntry: PageSectionCopy;
  directions: PageSectionCopy;
  expertise: PageSectionCopy;
  shopCampaign: PageSectionCopy & { image?: ImagePlacement; cta: PageCta };
  resume: PageSectionCopy & { primaryCta: PageCta; secondaryCta: PageCta };
};

export type ShopHomeCategorySlide = {
  id: string;
  kicker: string;
  title: string;
  action: string;
  href: string;
  desktopImage?: ImagePlacement;
  mobileImage?: ImagePlacement;
  alt: string;
};

export type ShopHomeVehicleSlide = {
  id: string;
  title: string;
  image?: ImagePlacement;
  alt: string;
};

export type ShopHomePageDraft = {
  id: "shop-home";
  seoTitle: string;
  seoDescription: string;
  hero: PageSectionCopy & { image?: ImagePlacement; cta: PageCta };
  wheelsIntro: PageSectionCopy & { kicker: string };
  orderSteps: { id: string; title: string; description: string }[];
  categoryCarousel: ShopHomeCategorySlide[];
  vehicles: PageSectionCopy & {
    cta: PageCta;
    slides: ShopHomeVehicleSlide[];
  };
};

export type PageDraft = HomePageDraft | ShopHomePageDraft | StubPageDraft;

export type ArticleDraft = {
  id: string;
  kind: "article" | "story";
  title: string;
  slug: string;
  excerpt: string;
  body: string;
  image?: ImagePlacement;
  gallery: ImagePlacement[];
  showInMenu: boolean;
  menuOrder: number;
  clientName: string;
  industry: string;
};

export type MediaListItem = {
  id: string;
  name: string;
  mimeType: string;
  dataUrl: string;
  usedBy: string[];
};

export type EntityRecord<T> = {
  id: string;
  draft: T;
  savedDraft: T | null;
  publishedSnapshot: T | null;
  hidden: boolean;
  slugLocked: boolean;
  lastSavedBy: string | null;
  lastPublishedBy: string | null;
};

export type TireModelListItem = {
  id: string;
  name: string;
  directionName: string;
  sizeCount: number;
  status: DocumentStatus;
  hasUnpublishedDraft: boolean;
  imageAssetId: string | null;
};
