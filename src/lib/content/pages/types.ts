import type { PageKey } from "./keys";

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
  imageUrl: string;
  imageAlt: string;
  primaryCta: PageCta;
  secondaryCta: PageCta;
  metricLabel: string;
  metricText: string;
};

export type HomeShopCampaignContent = PageShell & {
  imageUrl: string;
  imageAlt: string;
  cta: PageCta;
};

export type HomeResumeContent = PageShell & {
  primaryCta: PageCta;
  secondaryCta: PageCta;
};

export type HomePageContent = {
  key: "home";
  seoTitle?: string;
  seoDescription?: string;
  hero: HomeHeroContent;
  selectionEntry: PageShell;
  directions: PageShell;
  expertise: PageShell;
  shopCampaign: HomeShopCampaignContent;
  resume: HomeResumeContent;
};

export type ShopHeroContent = PageShell & {
  imageUrl: string;
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
