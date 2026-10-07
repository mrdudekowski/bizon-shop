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
  home_selection_entry_image_url?: string | null;
  home_selection_entry_image_alt?: string | null;
  home_selection_entry_eyebrow?: string | null;
  home_selection_entry_title?: string | null;
  home_selection_entry_lead?: string | null;
  home_shop_campaign_eyebrow?: string | null;
  home_shop_campaign_title?: string | null;
  home_shop_campaign_lead?: string | null;
  home_shop_campaign_image_url?: string | null;
  home_shop_campaign_image_alt?: string | null;
  home_shop_campaign_cta_label?: string | null;
  home_shop_campaign_cta_href?: string | null;
  home_directions_eyebrow?: string | null;
  home_directions_title?: string | null;
  home_directions_lead?: string | null;
  home_expertise_eyebrow?: string | null;
  home_expertise_title?: string | null;
  home_expertise_lead?: string | null;
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
  selectionEntry?: { eyebrow?: string; title?: string; lead?: string; imageUrl?: string; imageAlt?: string };
  shopCampaign?: {
    eyebrow?: string;
    title?: string;
    lead?: string;
    imageUrl?: string;
    imageAlt?: string;
    cta?: HomeCta;
  };
  directions?: { eyebrow?: string; title?: string; lead?: string };
  expertise?: { eyebrow?: string; title?: string; lead?: string };
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
  const directions = mapHomeShell(
    row.home_directions_eyebrow,
    row.home_directions_title,
    row.home_directions_lead,
  );
  const expertise = mapHomeShell(
    row.home_expertise_eyebrow,
    row.home_expertise_title,
    row.home_expertise_lead,
  );

  return {
    ...(nonEmptyString(row.seo_seo_title) ? { seoTitle: nonEmptyString(row.seo_seo_title) } : {}),
    ...(nonEmptyString(row.seo_seo_description)
      ? { seoDescription: nonEmptyString(row.seo_seo_description) }
      : {}),
    hero: {
      ...(nonEmptyString(row.home_hero_eyebrow) ? { eyebrow: nonEmptyString(row.home_hero_eyebrow) } : {}),
      ...(nonEmptyString(row.home_hero_title) ? { title: nonEmptyString(row.home_hero_title) } : {}),
      ...(nonEmptyString(row.home_hero_lead) ? { lead: nonEmptyString(row.home_hero_lead) } : {}),
      ...(primaryCta ? { primaryCta } : {}),
      ...(secondaryCta ? { secondaryCta } : {}),
      ...(nonEmptyString(row.home_hero_metric_label)
        ? { metricLabel: nonEmptyString(row.home_hero_metric_label) }
        : {}),
      ...(nonEmptyString(row.home_hero_metric_text) ? { metricText: nonEmptyString(row.home_hero_metric_text) } : {}),
      ...(publicImageUrl(row.home_hero_image_url)
        ? { imageUrl: publicImageUrl(row.home_hero_image_url) }
        : {}),
    },
    ...(shopCampaign ? { shopCampaign } : {}),
    ...(directions ? { directions } : {}),
    ...(expertise ? { expertise } : {}),
  };
}

function mapHomeShell(
  eyebrow: string | null | undefined,
  title: string | null | undefined,
  lead: string | null | undefined,
): { eyebrow?: string; title?: string; lead?: string } | undefined {
  const shell = {
    ...(nonEmptyString(eyebrow ?? null) ? { eyebrow: nonEmptyString(eyebrow ?? null) } : {}),
    ...(nonEmptyString(title ?? null) ? { title: nonEmptyString(title ?? null) } : {}),
    ...(nonEmptyString(lead ?? null) ? { lead: nonEmptyString(lead ?? null) } : {}),
  };
  return Object.keys(shell).length > 0 ? shell : undefined;
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
    ...(nonEmptyString(row.seo_seo_title) ? { seoTitle: nonEmptyString(row.seo_seo_title) } : {}),
    ...(nonEmptyString(row.seo_seo_description) ? { seoDescription: nonEmptyString(row.seo_seo_description) } : {}),
    hero: {
      ...(nonEmptyString(row.stub_hero_eyebrow) ? { eyebrow: nonEmptyString(row.stub_hero_eyebrow) } : {}),
      ...(nonEmptyString(row.stub_hero_title) ? { title: nonEmptyString(row.stub_hero_title) } : {}),
      ...(nonEmptyString(row.stub_hero_lead) ? { lead: nonEmptyString(row.stub_hero_lead) } : {}),
      ...(publicImageUrl(row.stub_hero_image_url)
        ? { imageUrl: publicImageUrl(row.stub_hero_image_url) }
        : {}),
      ...(nonEmptyString(row.stub_hero_image_alt) ? { imageAlt: nonEmptyString(row.stub_hero_image_alt) } : {}),
    },
  };
}

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
  shop_wheels_intro_kicker?: string | null;
  shop_wheels_intro_eyebrow?: string | null;
  shop_wheels_intro_title?: string | null;
  shop_wheels_intro_lead?: string | null;
  shop_vehicles_eyebrow?: string | null;
  shop_vehicles_title?: string | null;
  shop_vehicles_lead?: string | null;
  shop_vehicles_cta_label?: string | null;
  shop_vehicles_cta_href?: string | null;
  shop_catalog_eyebrow?: string | null;
  shop_catalog_title?: string | null;
  shop_catalog_lead?: string | null;
  shop_catalog_section_title?: string | null;
};

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
  wheelsIntro?: {
    kicker?: string;
    eyebrow?: string;
    title?: string;
    lead?: string;
  };
  orderSteps?: { title: string; description: string }[];
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
    eyebrow?: string;
    title?: string;
    lead?: string;
    cta?: HomeCta;
    slides?: { title?: string; image?: string; alt?: string }[];
  };
  catalog?: {
    copy: { eyebrow?: string; title?: string; lead?: string; sectionTitle?: string };
    tiles: {
      categoryId: string;
      categorySlug: string;
      title: string;
      visible: boolean;
      sortOrder: number;
      iconUrl?: string;
      imageUrl?: string;
      carouselImageUrl?: string;
      carouselVisible: boolean;
      iconAlt?: string;
      imageAlt?: string;
      carouselImageAlt?: string;
    }[];
  };
};

const optionalText = (value: string | null | undefined): string | undefined => value || undefined;

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
  catalogTiles?: {
    category_id: string | number;
    category_slug: string;
    title?: string | null;
    visible: boolean;
    sort_order: string | number;
    icon_url?: string | null;
    image_url?: string | null;
    carousel_image_url?: string | null;
    carousel_image_alt?: string | null;
    carousel_visible?: boolean;
    icon_alt?: string | null;
    image_alt?: string | null;
  }[];
  vehicles: { title?: string | null; image_url?: string | null; alt?: string | null }[];
  orderSteps?: { title?: string | null; description?: string | null }[];
}): ShopHomePatch {
  const { row, carousel, vehicles, orderSteps = [], catalogTiles = [] } = input;
  const cta = mapCta(row.shop_hero_cta_label, row.shop_hero_cta_href);
  const vehiclesCta = mapCta(row.shop_vehicles_cta_label ?? null, row.shop_vehicles_cta_href ?? null);
  const wheelsIntro = {
    ...(optionalText(row.shop_wheels_intro_kicker) ? { kicker: optionalText(row.shop_wheels_intro_kicker) } : {}),
    ...(optionalText(row.shop_wheels_intro_eyebrow) ? { eyebrow: optionalText(row.shop_wheels_intro_eyebrow) } : {}),
    ...(optionalText(row.shop_wheels_intro_title) ? { title: optionalText(row.shop_wheels_intro_title) } : {}),
    ...(optionalText(row.shop_wheels_intro_lead) ? { lead: optionalText(row.shop_wheels_intro_lead) } : {}),
  };
  const vehicleShell = {
    ...(optionalText(row.shop_vehicles_eyebrow) ? { eyebrow: optionalText(row.shop_vehicles_eyebrow) } : {}),
    ...(optionalText(row.shop_vehicles_title) ? { title: optionalText(row.shop_vehicles_title) } : {}),
    ...(optionalText(row.shop_vehicles_lead) ? { lead: optionalText(row.shop_vehicles_lead) } : {}),
    ...(vehiclesCta ? { cta: vehiclesCta } : {}),
  };

  return {
    ...(optionalText(row.seo_seo_title) ? { seoTitle: optionalText(row.seo_seo_title) } : {}),
    ...(optionalText(row.seo_seo_description) ? { seoDescription: optionalText(row.seo_seo_description) } : {}),
    hero: {
      ...(optionalText(row.shop_hero_eyebrow) ? { eyebrow: optionalText(row.shop_hero_eyebrow) } : {}),
      ...(optionalText(row.shop_hero_title) ? { title: optionalText(row.shop_hero_title) } : {}),
      ...(optionalText(row.shop_hero_lead) ? { lead: optionalText(row.shop_hero_lead) } : {}),
      ...(publicImageUrl(row.shop_hero_image_url) ? { imageUrl: publicImageUrl(row.shop_hero_image_url) } : {}),
      ...(optionalText(row.shop_hero_image_alt) ? { imageAlt: optionalText(row.shop_hero_image_alt) } : {}),
      ...(cta ? { cta } : {}),
    },
    ...(Object.keys(wheelsIntro).length > 0 ? { wheelsIntro } : {}),
    orderSteps: orderSteps.flatMap((step) => {
      const title = optionalText(step.title);
      const description = optionalText(step.description);
      return title || description ? [{ title: title ?? "", description: description ?? "" }] : [];
    }),
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
      ...vehicleShell,
      slides: vehicles.map((slide) => ({
        title: slide.title ?? "",
        alt: slide.alt ?? "",
        image: publicImageUrl(slide.image_url) ?? "",
      })),
    },
    catalog: {
      copy: {
        ...(optionalText(row.shop_catalog_eyebrow) ? { eyebrow: optionalText(row.shop_catalog_eyebrow) } : {}),
        ...(optionalText(row.shop_catalog_title) ? { title: optionalText(row.shop_catalog_title) } : {}),
        ...(optionalText(row.shop_catalog_lead) ? { lead: optionalText(row.shop_catalog_lead) } : {}),
        ...(optionalText(row.shop_catalog_section_title)
          ? { sectionTitle: optionalText(row.shop_catalog_section_title) }
          : {}),
      },
      tiles: catalogTiles.map((tile) => ({
        categoryId: String(tile.category_id),
        categorySlug: tile.category_slug,
        title: tile.title ?? "",
        visible: tile.visible,
        sortOrder: Number(tile.sort_order) || 0,
        ...(publicImageUrl(tile.icon_url) ? { iconUrl: publicImageUrl(tile.icon_url) } : {}),
        ...(publicImageUrl(tile.image_url) ? { imageUrl: publicImageUrl(tile.image_url) } : {}),
        ...(publicImageUrl(tile.carousel_image_url) ? { carouselImageUrl: publicImageUrl(tile.carousel_image_url) } : {}),
        carouselVisible: tile.carousel_visible ?? Boolean(tile.carousel_image_url),
        ...(optionalText(tile.icon_alt) ? { iconAlt: optionalText(tile.icon_alt) } : {}),
        ...(optionalText(tile.image_alt) ? { imageAlt: optionalText(tile.image_alt) } : {}),
        ...(optionalText(tile.carousel_image_alt) ? { carouselImageAlt: optionalText(tile.carousel_image_alt) } : {}),
      })),
    },
  };
}
