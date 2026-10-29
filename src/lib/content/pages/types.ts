import type { PageKey } from "./keys";
import type { ShopCampaignFrame } from "./shopCampaignFrames";

export type PageCta = {
  label: string;
  href: string;
};

export type PageShell = {
  eyebrow: string;
  title: string;
  lead: string;
};

export type HomeHeroContent = PageShell & {
  imageUrl: string | null;
  imageAlt: string;
  imageFocalX?: number;
  imageFocalY?: number;
  primaryCta: PageCta;
  secondaryCta: PageCta;
  metricLabel: string;
  metricText: string;
};

export type HomeShopCampaignContent = PageShell & {
  imageUrl: string | null;
  imageAlt: string;
  imageFocalX?: number;
  imageFocalY?: number;
  frames: ShopCampaignFrame[];
  cta: PageCta;
};

export type HomeExpertiseContent = PageShell & {
  imageUrl: string | null;
  imageAlt: string;
  imageFocalX?: number;
  imageFocalY?: number;
  cta: PageCta;
};

export type HomeBrandingContent = PageShell & {
  cta: PageCta;
  beforeCaption: string;
  afterCaption: string;
  beforeImageUrl: string | null;
  beforeImageAlt: string;
  beforeImageFocalX?: number;
  beforeImageFocalY?: number;
  afterImageUrl: string | null;
  afterImageAlt: string;
  afterImageFocalX?: number;
  afterImageFocalY?: number;
};

export type HomePageContent = {
  key: "home";
  seoTitle?: string;
  seoDescription?: string;
  hero: HomeHeroContent;
  directions: PageShell;
  expertise: HomeExpertiseContent;
  branding: HomeBrandingContent;
  shopCampaign: HomeShopCampaignContent;
};

export type ShopHeroContent = PageShell & {
  imageUrl: string | null;
  imageAlt: string;
  cta: PageCta;
};

export type ShopOrderStep = {
  title: string;
  description: string;
};

export type ShopCategorySlide = {
  id: string;
  kicker: string;
  title: string;
  action: string;
  href: string;
  desktopImage: string;
  mobileImage: string;
  alt: string;
};

export type ShopVehicleSlide = {
  title: string;
  image: string;
  alt: string;
};

export type ShopCatalogTile = {
  categoryId: string;
  categorySlug: string;
  title: string;
  visible: boolean;
  sortOrder: number;
  carouselVisible: boolean;
  iconUrl?: string;
  imageUrl?: string;
  carouselImageUrl?: string;
  iconAlt?: string;
  imageAlt?: string;
  carouselImageAlt?: string;
};

export type ShopCatalogCopy = {
  eyebrow: string;
  title: string;
  lead: string;
  sectionTitle: string;
};

export type ShopVehiclesContent = PageShell & {
  cta: PageCta;
  slides: ShopVehicleSlide[];
};

export type ShopHomePageContent = {
  key: "shop-home";
  seoTitle?: string;
  seoDescription?: string;
  hero: ShopHeroContent;
  wheelsIntro: PageShell & { kicker: string };
  orderSteps: ShopOrderStep[];
  categoryCarousel: ShopCategorySlide[];
  catalog: { copy: ShopCatalogCopy; tiles: ShopCatalogTile[] };
  vehicles: ShopVehiclesContent;
  /** Developer-owned preferred wheel card order (not editable on page). */
  preferredWheelSlugs: readonly string[];
};

export type StubMarketingPageContent = {
  key: Exclude<PageKey, "home" | "shop-home">;
  seoTitle?: string;
  seoDescription?: string;
  hero: PageShell & {
    imageUrl: string | null;
    imageAlt: string;
    imageFocalX?: number;
    imageFocalY?: number;
  };
};

export type PageContentByKey = {
  home: HomePageContent;
  "shop-home": ShopHomePageContent;
  about: StubMarketingPageContent;
  contact: StubMarketingPageContent;
  warranty: StubMarketingPageContent;
  branding: StubMarketingPageContent;
  "become-a-supplier": StubMarketingPageContent;
  "privacy-policy": StubMarketingPageContent;
  "shop-delivery-returns": StubMarketingPageContent;
};

export type AnyPageContent = PageContentByKey[PageKey];
