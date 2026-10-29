// Публичная форма карточки совпадает с main-app src/lib/content/types.ts.
// Код сайта сюда не импортируется.

import type { CatalogAxle } from "./options";

export type ImagePlacement = {
  assetId: string;
  /** Temporary uploaded file that will replace this asset after publication. */
  replacementAssetId?: string;
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
  shortDescription?: string;
  sortOrder: number;
  showInMenu: boolean;
  mainImage?: ImagePlacement;
  seoTitle?: string;
  seoDescription?: string;
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
  treadType: string;
  modelCode?: string;
  features?: { id: string; key: string; title: string; description: string }[];
  applicationTypes?: string[];
  selectionAxles: CatalogAxle[];
  available?: boolean;
  showInMenu: boolean;
  menuOrder: number;
  seoTitle?: string;
  seoDescription?: string;
};

export type PublishBlocker =
  | "name"
  | "slug"
  | "direction"
  | "mainImage"
  | "size"
  | "price"
  | "duplicateSize"
  | "duplicateSku"
  | "editorialPlaceholder";

export type DocumentStatus = "draft" | "on_site" | "hidden";
export type StatusEntity = "tire-direction" | "tire-model" | "wheel-type" | "wheel-model" | "shop-category" | "shop-product" | "page" | "material";

export type AdminRole = "admin" | "editor";
export type EditorCapability = "create_catalog_items" | "edit_site_pages";

export type AdminSession = {
  login: string;
  role: AdminRole;
  capabilities: EditorCapability[];
};

/** Flat list row for pickers; document methods use EntityRecord<TireDirectionDraft>. */
export type TireDirection = {
  id: string;
  name: string;
  slug: string;
  status: DocumentStatus;
  hasUnpublishedDraft: boolean;
  imageAssetId: string | null;
};

export type MediaAsset = {
  id: string;
  name: string;
  mimeType: string;
  /** Legacy API field: a public URL or site-relative path, not necessarily a data URI. Resolve before rendering. */
  dataUrl: string;
};

export type AdminUser = {
  id: string;
  login: string;
  role: AdminRole;
  disabled: boolean;
  capabilities: EditorCapability[];
};

export type ChangeSetId = string;

export type ChangeSetStatus = "open" | "pending_review" | "returned" | "published" | "cancelled";

export type FieldValue =
  | { kind: "text"; value: string }
  | { kind: "number"; value: number | null }
  | { kind: "boolean"; value: boolean }
  | { kind: "image"; assetId: string | null; previewUrl: string | null; alt?: string }
  | { kind: "empty" };

export type FieldLocation = {
  section: string;
  document: string;
  tab: string;
  field: string;
  itemLabel?: string;
};

export type FieldChange = {
  path: string;
  location: FieldLocation;
  before: FieldValue;
  after: FieldValue;
};

export type ChangeEntry = {
  id: string;
  entityType: StatusEntity;
  entityId: string;
  entityTitle: string;
  operation: "create" | "update" | "delete";
  fieldChanges: FieldChange[];
  rollbackDraft: unknown;
};

export type ChangeSet = {
  id: ChangeSetId;
  authorUserId: string;
  authorLogin: string;
  status: ChangeSetStatus;
  createdAt: string;
  updatedAt: string;
  submittedAt: string | null;
  reviewedAt: string | null;
  reviewedByLogin: string | null;
  reviewComment: string | null;
  entries: ChangeEntry[];
};

export type DocumentReviewLock = {
  changeSetId: string;
  authorLogin: string;
  status: Extract<ChangeSetStatus, "open" | "returned" | "pending_review">;
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
  sku?: string;
  diameter?: number;
  width?: number;
  boltHoles?: number;
  pcd: string;
  pcdMm?: number;
  offsetET?: number;
  centerBore?: number;
  loadRating?: string;
  weight?: number;
  color: string;
  finish?: string;
  fastenerType?: string;
  fastenerMaterial?: string;
  sourceSpecification?: string;
  compatibleTireSizes?: string;
  price?: number;
  priceOnRequest: boolean;
  available: boolean;
};

export type WheelTypeDraft = {
  id: string;
  name: string;
  slug: string;
  description: string;
  shortDescription?: string;
  mainImage?: ImagePlacement;
  sortOrder: number;
  showInMenu: boolean;
  seoTitle?: string;
  seoDescription?: string;
};

export type WheelModelDraft = {
  id: string;
  name: string;
  slug: string;
  wheelTypeId: string;
  series: string;
  designStyle?: string;
  material: string;
  constructionMethod: string;
  fitmentNotes: string;
  descriptionShort: string;
  descriptionLong: string;
  mainImage?: ImagePlacement;
  gallery: ImagePlacement[];
  documents: DocumentLink[];
  available?: boolean;
  showInMenu: boolean;
  menuOrder: number;
  seoTitle?: string;
  seoDescription?: string;
  variants: WheelVariantDraft[];
};

export type ShopCategoryCarouselSlide = {
  id: string;
  title?: string;
  image?: ImagePlacement | null;
};

export type ShopCategoryDraft = {
  id: string;
  name: string;
  slug: string;
  description: string;
  /** Иконка пункта меню. Одно фото галереи Shop живёт в carousel. */
  mainImage?: ImagePlacement;
  carousel: ShopCategoryCarouselSlide[];
  sortOrder: number;
  showInMenu: boolean;
  seoTitle?: string;
  seoDescription?: string;
};

export type ShopSubcategoryDraft = {
  id: string;
  categoryId: string;
  name: string;
  slug: string;
  sortOrder: number;
};

export type ShopVariantDraft = {
  id: string;
  color: string;
  size: string;
  configuration?: string;
  sku: string;
  price?: number;
  oldPrice?: number;
  priceOnRequest: boolean;
  available: boolean;
  image?: ImagePlacement;
};

export type ShopProductSpecItem = {
  id: string;
  label: string;
  value: string;
};

export type ShopProductDraft = {
  id: string;
  name: string;
  slug: string;
  categoryId: string;
  subcategoryId?: string;
  sku?: string;
  brand?: string;
  material?: string;
  sortOrder?: number;
  specifications?: ShopProductSpecItem[];
  descriptionShort: string;
  descriptionLong: string;
  price?: number;
  oldPrice?: number;
  priceOnRequest: boolean;
  available?: boolean;
  mainImage?: ImagePlacement;
  gallery: ImagePlacement[];
  seoTitle?: string;
  seoDescription?: string;
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
  "delivery-geography",
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

/** Pages whose request form is edited with the page. */
export const PAGE_FORM_KEYS = ["become-a-supplier", "delivery-geography"] as const;

export const LEGAL_PAGE_KEYS = ["privacy-policy", "warranty", "shop-delivery-returns"] as const;

/** Contacts and messenger channels of the contact page; stored in site_profile and site_profile_channels. */
export type SiteProfileDraft = {
  phone: string;
  email: string;
  address: string;
  channels: { id: string; label: string; href: string; enabled: boolean }[];
  legalSummary: string;
  priceNotice: string;
  madeToOrderNotice: string;
  requisites: { id: string; label: string; value: string }[];
};

/** Request form of the supplier and delivery-geography pages; stored in page_forms and page_form_fields. */
export type PageFormDraft = {
  successMessage: string;
  fields: { id: string; label: string; type: "text" | "tel" | "email" | "url" | "textarea"; required: boolean }[];
};

export type StubPageDraft = {
  id: Exclude<PageKey, "home" | "shop-home">;
  seoTitle: string;
  seoDescription: string;
  hero: PageSectionCopy & { image?: ImagePlacement | null };
  documents: DocumentLink[];
  featuresHeading?: string;
  features?: { id: string; title: string; text: string }[];
  sections?: { id: string; heading: string; body: string }[];
  notice?: { body: string } | null;
  proof?: { image?: ImagePlacement | null; title: string; text: string } | null;
  cta?: (PageCta & { secondaryLabel?: string; secondaryHref?: string }) | null;
  siteProfile?: SiteProfileDraft;
  form?: PageFormDraft;
};

export type HomePageDraft = {
  id: "home";
  seoTitle: string;
  seoDescription: string;
  hero: PageSectionCopy & {
    image?: ImagePlacement | null;
    primaryCta: PageCta;
    secondaryCta: PageCta;
    metricLabel: string;
    metricText: string;
  };
  directions: PageSectionCopy;
  expertise: PageSectionCopy & { image?: ImagePlacement | null; cta: PageCta };
  branding: PageSectionCopy & {
    cta: PageCta;
    beforeCaption: string;
    afterCaption: string;
    beforeImage?: ImagePlacement | null;
    afterImage?: ImagePlacement | null;
  };
  shopCampaign: PageSectionCopy & { image?: ImagePlacement | null; frames?: ImagePlacement[]; cta: PageCta };
};

export type ShopHomeCategorySlide = {
  id: string;
  kicker: string;
  title: string;
  action: string;
  href: string;
  desktopImage?: ImagePlacement | null;
  mobileImage?: ImagePlacement | null;
  alt: string;
};

export type ShopHomeVehicleSlide = {
  id: string;
  title: string;
  image?: ImagePlacement | null;
  alt: string;
};

export type ShopCatalogTileDraft = {
  categoryId: string;
  title: string;
  visible: boolean;
  sortOrder: number;
  carouselVisible: boolean;
  icon?: ImagePlacement | null;
  image?: ImagePlacement | null;
  carouselImage?: ImagePlacement | null;
};

export type ShopCatalogCopyDraft = {
  eyebrow: string;
  title: string;
  lead: string;
  sectionTitle: string;
};

export type ShopHomePageDraft = {
  id: "shop-home";
  seoTitle: string;
  seoDescription: string;
  hero: PageSectionCopy & { image?: ImagePlacement | null; cta: PageCta };
  wheelsIntro: PageSectionCopy & { kicker: string };
  orderSteps: { id: string; title: string; description: string }[];
  categoryCarousel: ShopHomeCategorySlide[];
  catalog: { copy: ShopCatalogCopyDraft; tiles: ShopCatalogTileDraft[] };
  vehicles: PageSectionCopy & {
    cta: PageCta;
    slides: ShopHomeVehicleSlide[];
  };
};

export type PageDraft = HomePageDraft | ShopHomePageDraft | StubPageDraft;

export type ArticleDraft = {
  id: string;
  kind: "article";
  title: string;
  slug: string;
  excerpt: string;
  body: string;
  image?: ImagePlacement | null;
  imageConfigured: boolean;
  gallery: ImagePlacement[];
  showInMenu: boolean;
  menuOrder: number;
  taxonomy: string[];
};

export type MediaUsageState = "published-visible" | "draft-unpublished" | "hidden-not-rendered";

export type MediaUsageRecord = {
  id: string;
  mediaId: string;
  topLevelKey: string;
  topLevelLabel: string;
  pageKey: string;
  pageLabel: string;
  placementKey: string;
  placementLabel: string;
  state: MediaUsageState;
  reviewRecommended: boolean;
  diagnosticReason?: string;
  detachable: boolean;
  sourceKey?: string;
};

export type MediaListItem = {
  id: string;
  name: string;
  mimeType: string;
  /** Legacy API field: a public URL or site-relative path, not necessarily a data URI. Resolve before rendering. */
  dataUrl: string;
  createdAt?: string;
  /** Missing only for responses from a pre-structured legacy API; an empty array means unused. */
  usages?: MediaUsageRecord[];
  usedBy: string[];
  replacementPending?: boolean;
};

export type MediaDeletionHistoryItem = {
  id: string;
  mediaId: string;
  filename: string;
  deletedBy: string;
  deletedAt: string;
};

export type PasswordResetHistoryItem = {
  id: string;
  targetLogin: string;
  resetBy: string;
  resetAt: string;
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
  directionId: string;
  directionName: string;
  sizeCount: number;
  status: DocumentStatus;
  hasUnpublishedDraft: boolean;
  imageAssetId: string | null;
  menuOrder?: number;
};

export type OrderableCatalogEntity =
  | "tire-direction"
  | "tire-model"
  | "wheel-type"
  | "wheel-model"
  | "shop-category"
  | "shop-product"
  | "material";

export type LeadRequestStatus =
  | "new"
  | "in_progress"
  | "contacted"
  | "qualified"
  | "won"
  | "lost"
  | "closed"
  | "spam"
  | "archived";

export type LeadRequestItem = {
  id: string;
  itemType: string;
  name: string;
  slug: string;
  parentSlug?: string;
  variantLabel?: string;
  quantity: number;
  price?: number;
  priceOnRequest: boolean;
  url?: string;
  notes?: string;
};

export type LeadRequestRecord = {
  id: string;
  status: LeadRequestStatus;
  clientType: string;
  name: string;
  phone: string;
  email?: string;
  city?: string;
  companyName?: string;
  inn?: string;
  position?: string;
  purchaseVolume?: string;
  preferredContact?: string;
  message?: string;
  sourceForm: string;
  sourcePage?: string;
  createdAt: string;
  updatedAt: string;
  items: LeadRequestItem[];
};
