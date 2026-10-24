import type {
  HomePageContent,
  HomeExpertiseContent,
  HomeBrandingContent,
  PageCta,
  PageShell,
  ShopCategorySlide,
  ShopCatalogCopy,
  ShopHomePageContent,
  ShopCatalogTile,
  ShopOrderStep,
  ShopVehicleSlide,
  StubMarketingPageContent,
} from "./types";

export function pickText(value: unknown, fallback: string): string {
  return typeof value === "string" ? value : fallback;
}

function retireSelectionHref(href: string): string {
  if (href === "/selection" || href.startsWith("/selection?") || href === "/#solutions" || href.endsWith("#solutions")) {
    return "/models";
  }
  return href;
}

export function pickCta(
  value: { label?: string | null; href?: string | null } | null | undefined,
  fallback: PageCta,
): PageCta {
  const requestedHref = pickText(value?.href, fallback.href);
  const href = retireSelectionHref(requestedHref);
  const requestedLabel = pickText(value?.label, fallback.label);
  const label = href !== requestedHref && /подбор|подобр/i.test(requestedLabel)
    ? fallback.label
    : requestedLabel;
  return {
    label,
    href,
  };
}

export function pickShell(
  value:
    | { eyebrow?: string | null; title?: string | null; lead?: string | null }
    | null
    | undefined,
  fallback: PageShell,
): PageShell {
  return {
    eyebrow: pickText(value?.eyebrow, fallback.eyebrow),
    title: pickText(value?.title, fallback.title),
    lead: pickText(value?.lead, fallback.lead),
  };
}

export function pickImageUrl(value: string | null | undefined, fallback: string): string | null {
  if (value === undefined) return fallback;
  if (value === null) return null;
  return value.trim() || null;
}

type CtaPatch = Partial<PageCta> | undefined;

export function mergeHomeContent(
  defaults: HomePageContent,
  patch: {
    seoTitle?: string;
    seoDescription?: string;
    hero?: Partial<Omit<HomePageContent["hero"], "primaryCta" | "secondaryCta">> & {
      primaryCta?: CtaPatch;
      secondaryCta?: CtaPatch;
    };
    directions?: Partial<PageShell>;
    expertise?: Partial<Omit<HomeExpertiseContent, "cta">> & { cta?: CtaPatch };
    branding?: Partial<Omit<HomeBrandingContent, "cta">> & { cta?: CtaPatch };
    shopCampaign?: Partial<Omit<HomePageContent["shopCampaign"], "cta">> & {
      cta?: CtaPatch;
    };
  },
): HomePageContent {
  return {
    key: "home",
    seoTitle: patch.seoTitle ?? defaults.seoTitle,
    seoDescription: patch.seoDescription ?? defaults.seoDescription,
    hero: {
      ...pickShell(patch.hero, defaults.hero),
      imageUrl: pickImageUrl(patch.hero?.imageUrl, defaults.hero.imageUrl),
      imageAlt: pickText(patch.hero?.imageAlt, defaults.hero.imageAlt),
      imageFocalX: patch.hero?.imageFocalX ?? defaults.hero.imageFocalX,
      imageFocalY: patch.hero?.imageFocalY ?? defaults.hero.imageFocalY,
      primaryCta: pickCta(patch.hero?.primaryCta, defaults.hero.primaryCta),
      secondaryCta: pickCta(patch.hero?.secondaryCta, defaults.hero.secondaryCta),
      metricLabel: pickText(patch.hero?.metricLabel, defaults.hero.metricLabel),
      metricText: pickText(patch.hero?.metricText, defaults.hero.metricText),
    },
    directions: pickShell(patch.directions, defaults.directions),
    expertise: {
      ...pickShell(patch.expertise, defaults.expertise),
      imageUrl: pickImageUrl(patch.expertise?.imageUrl, defaults.expertise.imageUrl),
      imageAlt: pickText(patch.expertise?.imageAlt, defaults.expertise.imageAlt),
      imageFocalX: patch.expertise?.imageFocalX ?? defaults.expertise.imageFocalX,
      imageFocalY: patch.expertise?.imageFocalY ?? defaults.expertise.imageFocalY,
      cta: pickCta(patch.expertise?.cta, defaults.expertise.cta),
    },
    branding: {
      ...pickShell(patch.branding, defaults.branding),
      cta: pickCta(patch.branding?.cta, defaults.branding.cta),
      beforeCaption: pickText(patch.branding?.beforeCaption, defaults.branding.beforeCaption),
      afterCaption: pickText(patch.branding?.afterCaption, defaults.branding.afterCaption),
      beforeImageUrl: pickImageUrl(patch.branding?.beforeImageUrl, defaults.branding.beforeImageUrl),
      beforeImageAlt: pickText(patch.branding?.beforeImageAlt, defaults.branding.beforeImageAlt),
      beforeImageFocalX: patch.branding?.beforeImageFocalX ?? defaults.branding.beforeImageFocalX,
      beforeImageFocalY: patch.branding?.beforeImageFocalY ?? defaults.branding.beforeImageFocalY,
      afterImageUrl: pickImageUrl(patch.branding?.afterImageUrl, defaults.branding.afterImageUrl),
      afterImageAlt: pickText(patch.branding?.afterImageAlt, defaults.branding.afterImageAlt),
      afterImageFocalX: patch.branding?.afterImageFocalX ?? defaults.branding.afterImageFocalX,
      afterImageFocalY: patch.branding?.afterImageFocalY ?? defaults.branding.afterImageFocalY,
    },
    shopCampaign: {
      ...pickShell(patch.shopCampaign, defaults.shopCampaign),
      imageUrl: pickImageUrl(patch.shopCampaign?.imageUrl, defaults.shopCampaign.imageUrl),
      imageAlt: pickText(patch.shopCampaign?.imageAlt, defaults.shopCampaign.imageAlt),
      imageFocalX: patch.shopCampaign?.imageFocalX ?? defaults.shopCampaign.imageFocalX,
      imageFocalY: patch.shopCampaign?.imageFocalY ?? defaults.shopCampaign.imageFocalY,
      cta: pickCta(patch.shopCampaign?.cta, defaults.shopCampaign.cta),
    },
  };
}

export function mergeShopHomeContent(
  defaults: ShopHomePageContent,
  patch: {
    seoTitle?: string;
    seoDescription?: string;
    hero?: Partial<Omit<ShopHomePageContent["hero"], "cta">> & { cta?: CtaPatch };
    wheelsIntro?: Partial<ShopHomePageContent["wheelsIntro"]>;
    orderSteps?: ShopOrderStep[];
    categoryCarousel?: ShopCategorySlide[];
    catalog?: {
      copy?: Partial<ShopCatalogCopy>;
      tiles?: ShopCatalogTile[];
    };
    vehicles?: Partial<Omit<ShopHomePageContent["vehicles"], "cta" | "slides">> & {
      cta?: CtaPatch;
      slides?: ShopVehicleSlide[];
    };
  },
): ShopHomePageContent {
  return {
    key: "shop-home",
    seoTitle: patch.seoTitle ?? defaults.seoTitle,
    seoDescription: patch.seoDescription ?? defaults.seoDescription,
    hero: {
      ...pickShell(patch.hero, defaults.hero),
      imageUrl: pickImageUrl(patch.hero?.imageUrl, defaults.hero.imageUrl),
      imageAlt: pickText(patch.hero?.imageAlt, defaults.hero.imageAlt),
      cta: pickCta(patch.hero?.cta, defaults.hero.cta),
    },
    wheelsIntro: {
      ...pickShell(patch.wheelsIntro, defaults.wheelsIntro),
      kicker: pickText(patch.wheelsIntro?.kicker, defaults.wheelsIntro.kicker),
    },
    orderSteps: patch.orderSteps ?? defaults.orderSteps,
    categoryCarousel: patch.categoryCarousel ?? defaults.categoryCarousel,
    catalog: {
      copy: {
        eyebrow: pickText(patch.catalog?.copy?.eyebrow, defaults.catalog.copy.eyebrow),
        title: pickText(patch.catalog?.copy?.title, defaults.catalog.copy.title),
        lead: pickText(patch.catalog?.copy?.lead, defaults.catalog.copy.lead),
        sectionTitle: pickText(patch.catalog?.copy?.sectionTitle, defaults.catalog.copy.sectionTitle),
      },
      tiles: patch.catalog?.tiles ?? defaults.catalog.tiles,
    },
    vehicles: {
      ...pickShell(patch.vehicles, defaults.vehicles),
      cta: pickCta(patch.vehicles?.cta, defaults.vehicles.cta),
      slides: patch.vehicles?.slides ?? defaults.vehicles.slides,
    },
    preferredWheelSlugs: defaults.preferredWheelSlugs,
  };
}

export function mergeStubContent(
  defaults: StubMarketingPageContent,
  patch: Partial<{
    seoTitle: string;
    seoDescription: string;
    hero: Partial<StubMarketingPageContent["hero"]>;
  }>,
): StubMarketingPageContent {
  return {
    key: defaults.key,
    seoTitle: patch.seoTitle ?? defaults.seoTitle,
    seoDescription: patch.seoDescription ?? defaults.seoDescription,
    hero: {
      ...pickShell(patch.hero, defaults.hero),
      imageUrl: pickImageUrl(patch.hero?.imageUrl, defaults.hero.imageUrl),
      imageAlt: pickText(patch.hero?.imageAlt, defaults.hero.imageAlt),
    },
  };
}
