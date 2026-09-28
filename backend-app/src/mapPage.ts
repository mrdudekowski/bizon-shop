import { normalizeImageUrl } from "./mapTire";

type HomeRow = {
  seo_seo_title: string | null;
  seo_seo_description: string | null;
  home_hero_eyebrow: string | null;
  home_hero_title: string | null;
  home_hero_lead: string | null;
  home_hero_primary_cta_label: string | null;
  home_hero_primary_cta_href: string | null;
  home_hero_secondary_cta_label: string | null;
  home_hero_secondary_cta_href: string | null;
  home_hero_metric_label: string | null;
  home_hero_metric_text: string | null;
  home_hero_image_url?: string | null;
  home_shop_campaign_eyebrow?: string | null;
  home_shop_campaign_title?: string | null;
  home_shop_campaign_lead?: string | null;
  home_shop_campaign_image_url?: string | null;
  home_shop_campaign_image_alt?: string | null;
  home_shop_campaign_cta_label?: string | null;
  home_shop_campaign_cta_href?: string | null;
};

type HomeCta = {
  label?: string;
  href?: string;
};

export type HomePatch = {
  seoTitle?: string;
  seoDescription?: string;
  hero: {
    eyebrow?: string;
    title?: string;
    lead?: string;
    primaryCta?: HomeCta;
    secondaryCta?: HomeCta;
    metricLabel?: string;
    metricText?: string;
    imageUrl?: string;
  };
  shopCampaign?: {
    eyebrow?: string;
    title?: string;
    lead?: string;
    imageUrl?: string;
    imageAlt?: string;
    cta?: HomeCta;
  };
};

function publicImageUrl(value: string | null | undefined): string | undefined {
  return normalizeImageUrl(value?.trim()) ?? undefined;
}

const nonEmptyString = (value: string | null): string | undefined => value || undefined;

function mapCta(label: string | null, href: string | null): HomeCta | undefined {
  const mappedLabel = nonEmptyString(label);
  const mappedHref = nonEmptyString(href);

  if (!mappedLabel && !mappedHref) {
    return undefined;
  }

  return {
    ...(mappedLabel ? { label: mappedLabel } : {}),
    ...(mappedHref ? { href: mappedHref } : {}),
  };
}

export function mapHomePatch(row: HomeRow): HomePatch {
  const primaryCta = mapCta(row.home_hero_primary_cta_label, row.home_hero_primary_cta_href);
  const secondaryCta = mapCta(row.home_hero_secondary_cta_label, row.home_hero_secondary_cta_href);
  const shopCampaign = mapHomeShopCampaign(row);

  return {
    ...(nonEmptyString(row.seo_seo_title) ? { seoTitle: row.seo_seo_title } : {}),
    ...(nonEmptyString(row.seo_seo_description)
      ? { seoDescription: row.seo_seo_description }
      : {}),
    hero: {
      ...(nonEmptyString(row.home_hero_eyebrow) ? { eyebrow: row.home_hero_eyebrow } : {}),
      ...(nonEmptyString(row.home_hero_title) ? { title: row.home_hero_title } : {}),
      ...(nonEmptyString(row.home_hero_lead) ? { lead: row.home_hero_lead } : {}),
      ...(primaryCta ? { primaryCta } : {}),
      ...(secondaryCta ? { secondaryCta } : {}),
      ...(nonEmptyString(row.home_hero_metric_label)
        ? { metricLabel: row.home_hero_metric_label }
        : {}),
      ...(nonEmptyString(row.home_hero_metric_text) ? { metricText: row.home_hero_metric_text } : {}),
      ...(publicImageUrl(row.home_hero_image_url)
        ? { imageUrl: publicImageUrl(row.home_hero_image_url) }
        : {}),
    },
    ...(shopCampaign ? { shopCampaign } : {}),
  };
}

function mapHomeShopCampaign(row: HomeRow): HomePatch["shopCampaign"] | undefined {
  const cta = mapCta(row.home_shop_campaign_cta_label ?? null, row.home_shop_campaign_cta_href ?? null);
  const imageUrl = publicImageUrl(row.home_shop_campaign_image_url);
  const campaign = {
    ...(nonEmptyString(row.home_shop_campaign_eyebrow ?? null) ? { eyebrow: row.home_shop_campaign_eyebrow ?? undefined } : {}),
    ...(nonEmptyString(row.home_shop_campaign_title ?? null) ? { title: row.home_shop_campaign_title ?? undefined } : {}),
    ...(nonEmptyString(row.home_shop_campaign_lead ?? null) ? { lead: row.home_shop_campaign_lead ?? undefined } : {}),
    ...(imageUrl ? { imageUrl } : {}),
    ...(nonEmptyString(row.home_shop_campaign_image_alt ?? null)
      ? { imageAlt: row.home_shop_campaign_image_alt ?? undefined }
      : {}),
    ...(cta ? { cta } : {}),
  };
  return Object.keys(campaign).length > 0 ? campaign : undefined;
}

export type StubPatch = {
  seoTitle?: string;
  seoDescription?: string;
  hero: {
    eyebrow?: string;
    title?: string;
    lead?: string;
    imageUrl?: string;
    imageAlt?: string;
  };
};

type StubRow = {
  seo_seo_title: string | null;
  seo_seo_description: string | null;
  stub_hero_eyebrow: string | null;
  stub_hero_title: string | null;
  stub_hero_lead: string | null;
  stub_hero_image_url?: string | null;
  stub_hero_image_alt: string | null;
};

export function mapStubPatch(row: StubRow): StubPatch {
  return {
    ...(nonEmptyString(row.seo_seo_title) ? { seoTitle: row.seo_seo_title } : {}),
    ...(nonEmptyString(row.seo_seo_description) ? { seoDescription: row.seo_seo_description } : {}),
    hero: {
      ...(nonEmptyString(row.stub_hero_eyebrow) ? { eyebrow: row.stub_hero_eyebrow } : {}),
      ...(nonEmptyString(row.stub_hero_title) ? { title: row.stub_hero_title } : {}),
      ...(nonEmptyString(row.stub_hero_lead) ? { lead: row.stub_hero_lead } : {}),
      ...(publicImageUrl(row.stub_hero_image_url)
        ? { imageUrl: publicImageUrl(row.stub_hero_image_url) }
        : {}),
      ...(nonEmptyString(row.stub_hero_image_alt) ? { imageAlt: row.stub_hero_image_alt } : {}),
    },
  };
}

export type ShopHomePatch = {
  seoTitle?: string;
  seoDescription?: string;
  hero: {
    eyebrow?: string;
    title?: string;
    lead?: string;
    imageUrl?: string;
    imageAlt?: string;
    cta?: HomeCta;
  };
  categoryCarousel?: {
    id: string;
    kicker?: string;
    title?: string;
    action?: string;
    href?: string;
    desktopImage?: string;
    mobileImage?: string;
    alt?: string;
  }[];
  vehicles?: {
    slides?: { title?: string; image?: string; alt?: string }[];
  };
};

type ShopHomeRow = {
  seo_seo_title: string | null;
  seo_seo_description: string | null;
  shop_hero_eyebrow: string | null;
  shop_hero_title: string | null;
  shop_hero_lead: string | null;
  shop_hero_cta_label: string | null;
  shop_hero_cta_href: string | null;
  shop_hero_image_url?: string | null;
  shop_hero_image_alt: string | null;
};

export function mapShopHomePatch(input: {
  row: ShopHomeRow;
  carousel: {
    id: string | number;
    kicker?: string | null;
    title?: string | null;
    action?: string | null;
    href?: string | null;
    desktop_image_url?: string | null;
    mobile_image_url?: string | null;
    alt?: string | null;
  }[];
  vehicles: { title?: string | null; image_url?: string | null; alt?: string | null }[];
}): ShopHomePatch {
  const { row, carousel, vehicles } = input;
  const cta = mapCta(row.shop_hero_cta_label, row.shop_hero_cta_href);
  return {
    ...(nonEmptyString(row.seo_seo_title) ? { seoTitle: row.seo_seo_title } : {}),
    ...(nonEmptyString(row.seo_seo_description) ? { seoDescription: row.seo_seo_description } : {}),
    hero: {
      ...(nonEmptyString(row.shop_hero_eyebrow) ? { eyebrow: row.shop_hero_eyebrow } : {}),
      ...(nonEmptyString(row.shop_hero_title) ? { title: row.shop_hero_title } : {}),
      ...(nonEmptyString(row.shop_hero_lead) ? { lead: row.shop_hero_lead } : {}),
      ...(publicImageUrl(row.shop_hero_image_url) ? { imageUrl: publicImageUrl(row.shop_hero_image_url) } : {}),
      ...(nonEmptyString(row.shop_hero_image_alt) ? { imageAlt: row.shop_hero_image_alt } : {}),
      ...(cta ? { cta } : {}),
    },
    categoryCarousel: carousel.map((slide) => ({
      id: String(slide.id),
      kicker: slide.kicker ?? "",
      title: slide.title ?? "",
      action: slide.action ?? "",
      href: slide.href ?? "",
      alt: slide.alt ?? "",
      desktopImage: publicImageUrl(slide.desktop_image_url) ?? "",
      mobileImage: publicImageUrl(slide.mobile_image_url) ?? "",
    })),
    vehicles: {
      slides: vehicles.map((slide) => ({
        title: slide.title ?? "",
        alt: slide.alt ?? "",
        image: publicImageUrl(slide.image_url) ?? "",
      })),
    },
  };
}
