import type {
  HomePageContent,
  PageCta,
  PageShell,
  ShopCategorySlide,
  ShopHomePageContent,
  ShopOrderStep,
  ShopVehicleSlide,
  StubMarketingPageContent,
} from "./types";

export function pickText(value: unknown, fallback: string): string {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

export function pickCta(
  value: { label?: string | null; href?: string | null } | null | undefined,
  fallback: PageCta,
): PageCta {
  return {
    label: pickText(value?.label, fallback.label),
    href: pickText(value?.href, fallback.href),
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

export function pickImageUrl(value: string | null | undefined, fallback: string): string {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
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
    selectionEntry?: Partial<PageShell>;
    directions?: Partial<PageShell>;
    expertise?: Partial<PageShell>;
    shopCampaign?: Partial<Omit<HomePageContent["shopCampaign"], "cta">> & {
      cta?: CtaPatch;
    };
    resume?: Partial<Omit<HomePageContent["resume"], "primaryCta" | "secondaryCta">> & {
      primaryCta?: CtaPatch;
      secondaryCta?: CtaPatch;
    };
  },
): HomePageContent {
  return {
    key: "home",
    seoTitle: patch.seoTitle || defaults.seoTitle,
    seoDescription: patch.seoDescription || defaults.seoDescription,
    hero: {
      ...pickShell(patch.hero, defaults.hero),
      imageUrl: pickImageUrl(patch.hero?.imageUrl, defaults.hero.imageUrl),
      imageAlt: pickText(patch.hero?.imageAlt, defaults.hero.imageAlt),
      primaryCta: pickCta(patch.hero?.primaryCta, defaults.hero.primaryCta),
      secondaryCta: pickCta(patch.hero?.secondaryCta, defaults.hero.secondaryCta),
      metricLabel: pickText(patch.hero?.metricLabel, defaults.hero.metricLabel),
      metricText: pickText(patch.hero?.metricText, defaults.hero.metricText),
    },
    selectionEntry: pickShell(patch.selectionEntry, defaults.selectionEntry),
    directions: pickShell(patch.directions, defaults.directions),
    expertise: pickShell(patch.expertise, defaults.expertise),
    shopCampaign: {
      ...pickShell(patch.shopCampaign, defaults.shopCampaign),
      imageUrl: pickImageUrl(patch.shopCampaign?.imageUrl, defaults.shopCampaign.imageUrl),
      imageAlt: pickText(patch.shopCampaign?.imageAlt, defaults.shopCampaign.imageAlt),
      cta: pickCta(patch.shopCampaign?.cta, defaults.shopCampaign.cta),
    },
    resume: {
      ...pickShell(patch.resume, defaults.resume),
      primaryCta: pickCta(patch.resume?.primaryCta, defaults.resume.primaryCta),
      secondaryCta: pickCta(patch.resume?.secondaryCta, defaults.resume.secondaryCta),
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
    vehicles?: Partial<Omit<ShopHomePageContent["vehicles"], "cta" | "slides">> & {
      cta?: CtaPatch;
      slides?: ShopVehicleSlide[];
    };
  },
): ShopHomePageContent {
  return {
    key: "shop-home",
    seoTitle: patch.seoTitle || defaults.seoTitle,
    seoDescription: patch.seoDescription || defaults.seoDescription,
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
    orderSteps:
      patch.orderSteps && patch.orderSteps.length > 0
        ? patch.orderSteps
        : defaults.orderSteps,
    categoryCarousel:
      patch.categoryCarousel && patch.categoryCarousel.length > 0
        ? patch.categoryCarousel
        : defaults.categoryCarousel,
    vehicles: {
      ...pickShell(patch.vehicles, defaults.vehicles),
      cta: pickCta(patch.vehicles?.cta, defaults.vehicles.cta),
      slides:
        patch.vehicles?.slides && patch.vehicles.slides.length > 0
          ? patch.vehicles.slides
          : defaults.vehicles.slides,
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
    seoTitle: patch.seoTitle || defaults.seoTitle,
    seoDescription: patch.seoDescription || defaults.seoDescription,
    hero: {
      ...pickShell(patch.hero, defaults.hero),
      imageUrl:
        typeof patch.hero?.imageUrl === "string" && patch.hero.imageUrl.trim()
          ? patch.hero.imageUrl.trim()
          : defaults.hero.imageUrl,
      imageAlt: pickText(patch.hero?.imageAlt, defaults.hero.imageAlt),
    },
  };
}
