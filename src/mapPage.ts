import type { SiteProfile } from "./content/siteProfile";
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
  home_hero_image_alt?: string | null;
  home_hero_image_focal_x?: number | null;
  home_hero_image_focal_y?: number | null;
  home_shop_campaign_eyebrow?: string | null;
  home_shop_campaign_title?: string | null;
  home_shop_campaign_lead?: string | null;
  home_shop_campaign_image_url?: string | null;
  home_shop_campaign_image_alt?: string | null;
  home_shop_campaign_image_focal_x?: number | null;
  home_shop_campaign_image_focal_y?: number | null;
  home_shop_campaign_cta_label?: string | null;
  home_shop_campaign_cta_href?: string | null;
  home_directions_eyebrow?: string | null;
  home_directions_title?: string | null;
  home_directions_lead?: string | null;
  home_expertise_eyebrow?: string | null;
  home_expertise_title?: string | null;
  home_expertise_lead?: string | null;
  home_branding_eyebrow?: string | null;
  home_branding_title?: string | null;
  home_branding_lead?: string | null;
  home_branding_cta_label?: string | null;
  home_branding_cta_href?: string | null;
  home_branding_before_caption?: string | null;
  home_branding_after_caption?: string | null;
  home_branding_before_image_url?: string | null;
  home_branding_before_image_alt?: string | null;
  home_branding_after_image_url?: string | null;
  home_branding_after_image_alt?: string | null;
  home_branding_before_image_focal_x?: number | null;
  home_branding_before_image_focal_y?: number | null;
  home_branding_after_image_focal_x?: number | null;
  home_branding_after_image_focal_y?: number | null;
  home_expertise_image_url?: string | null;
  home_expertise_image_alt?: string | null;
  home_expertise_image_focal_x?: number | null;
  home_expertise_image_focal_y?: number | null;
  home_expertise_cta_label?: string | null;
  home_expertise_cta_href?: string | null;
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
    imageUrl?: string | null;
    imageAlt?: string;
    imageFocalX?: number;
    imageFocalY?: number;
  };
  shopCampaign?: {
    eyebrow?: string;
    title?: string;
    lead?: string;
    imageUrl?: string | null;
    imageAlt?: string;
    imageFocalX?: number;
    imageFocalY?: number;
    frames?: { imageUrl: string; imageAlt: string; imageFocalX?: number; imageFocalY?: number }[];
    cta?: HomeCta;
  };
  directions?: { eyebrow?: string; title?: string; lead?: string };
  expertise?: { eyebrow?: string; title?: string; lead?: string; imageUrl?: string | null; imageAlt?: string; imageFocalX?: number; imageFocalY?: number; cta?: HomeCta };
  branding?: { eyebrow?: string; title?: string; lead?: string; cta?: HomeCta; beforeCaption?: string; afterCaption?: string; beforeImageUrl?: string | null; beforeImageAlt?: string; beforeImageFocalX?: number; beforeImageFocalY?: number; afterImageUrl?: string | null; afterImageAlt?: string; afterImageFocalX?: number; afterImageFocalY?: number };
};

function publicImageUrl(value: string | null | undefined): string | undefined {
  return normalizeImageUrl(value?.trim()) ?? undefined;
}

const nonEmptyString = (value: string | null): string | undefined => value || undefined;
const configuredString = (value: string | null | undefined): string | undefined =>
  value === null || value === undefined ? undefined : value;

function hasOwn(row: HomeRow, key: keyof HomeRow): boolean {
  return Object.prototype.hasOwnProperty.call(row, key);
}

function mapOptionalImageUrl(row: HomeRow, key: "home_expertise_image_url" | "home_branding_before_image_url" | "home_branding_after_image_url"): string | null | undefined {
  if (!hasOwn(row, key)) return undefined;
  return publicImageUrl(row[key]) ?? null;
}

function mapEditableHomeCta(
  row: HomeRow,
  labelKey: "home_expertise_cta_label" | "home_branding_cta_label",
  hrefKey: "home_expertise_cta_href" | "home_branding_cta_href",
): HomeCta | undefined {
  if (!hasOwn(row, labelKey) && !hasOwn(row, hrefKey)) return undefined;
  return {
    label: nonEmptyString(row[labelKey] ?? null) ?? "",
    href: nonEmptyString(row[hrefKey] ?? null) ?? "",
  };
}
function mapCta(label: string | null, href: string | null): HomeCta | undefined {
  if (label === null && href === null) return undefined;
  return {
    ...(label !== null ? { label } : {}),
    ...(href !== null ? { href } : {}),
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
  const expertiseShell = mapHomeShell(row.home_expertise_eyebrow, row.home_expertise_title, row.home_expertise_lead);
  const expertiseImageUrl = mapOptionalImageUrl(row, "home_expertise_image_url");
  const expertiseCta = mapEditableHomeCta(row, "home_expertise_cta_label", "home_expertise_cta_href");
  const expertise = expertiseShell || expertiseImageUrl !== undefined || expertiseCta || row.home_expertise_image_alt
    ? { ...expertiseShell, ...(expertiseImageUrl !== undefined ? { imageUrl: expertiseImageUrl } : {}),
        ...(nonEmptyString(row.home_expertise_image_alt ?? null) ? { imageAlt: row.home_expertise_image_alt! } : {}),
        ...(typeof row.home_expertise_image_focal_x === "number" ? { imageFocalX: row.home_expertise_image_focal_x } : {}),
        ...(typeof row.home_expertise_image_focal_y === "number" ? { imageFocalY: row.home_expertise_image_focal_y } : {}),
        ...(expertiseCta ? { cta: expertiseCta } : {}) }
    : undefined;
  const branding = mapHomeBranding(row);

  return {
    ...(configuredString(row.seo_seo_title) !== undefined ? { seoTitle: row.seo_seo_title! } : {}),
    ...(configuredString(row.seo_seo_description) !== undefined ? { seoDescription: row.seo_seo_description! } : {}),
    hero: {
      ...(configuredString(row.home_hero_eyebrow) !== undefined ? { eyebrow: row.home_hero_eyebrow! } : {}),
      ...(configuredString(row.home_hero_title) !== undefined ? { title: row.home_hero_title! } : {}),
      ...(configuredString(row.home_hero_lead) !== undefined ? { lead: row.home_hero_lead! } : {}),
      ...(primaryCta ? { primaryCta } : {}),
      ...(secondaryCta ? { secondaryCta } : {}),
      ...(configuredString(row.home_hero_metric_label) !== undefined ? { metricLabel: row.home_hero_metric_label! } : {}),
      ...(configuredString(row.home_hero_metric_text) !== undefined ? { metricText: row.home_hero_metric_text! } : {}),
      ...(hasOwn(row, "home_hero_image_url") ? { imageUrl: normalizeImageUrl(row.home_hero_image_url) } : {}),
      ...(configuredString(row.home_hero_image_alt) !== undefined ? { imageAlt: row.home_hero_image_alt! } : {}),
      ...(typeof row.home_hero_image_focal_x === "number" ? { imageFocalX: row.home_hero_image_focal_x } : {}),
      ...(typeof row.home_hero_image_focal_y === "number" ? { imageFocalY: row.home_hero_image_focal_y } : {}),
    },
    ...(shopCampaign ? { shopCampaign } : {}),
    ...(directions ? { directions } : {}),
    ...(expertise ? { expertise } : {}),
    ...(branding ? { branding } : {}),
  };
}

function mapHomeShell(
  eyebrow: string | null | undefined,
  title: string | null | undefined,
  lead: string | null | undefined,
): { eyebrow?: string; title?: string; lead?: string } | undefined {
  const shell = {
      ...(configuredString(eyebrow) !== undefined ? { eyebrow: eyebrow! } : {}),
      ...(configuredString(title) !== undefined ? { title: title! } : {}),
      ...(configuredString(lead) !== undefined ? { lead: lead! } : {}),
  };
  return Object.keys(shell).length > 0 ? shell : undefined;
}

function mapHomeBranding(row: HomeRow): NonNullable<HomePatch["branding"]> | undefined {
  const cta = mapEditableHomeCta(row, "home_branding_cta_label", "home_branding_cta_href");
  const beforeImageUrl = mapOptionalImageUrl(row, "home_branding_before_image_url");
  const afterImageUrl = mapOptionalImageUrl(row, "home_branding_after_image_url");
  const mapped = {
    ...(configuredString(row.home_branding_eyebrow) !== undefined ? { eyebrow: row.home_branding_eyebrow! } : {}),
    ...(configuredString(row.home_branding_title) !== undefined ? { title: row.home_branding_title! } : {}),
    ...(configuredString(row.home_branding_lead) !== undefined ? { lead: row.home_branding_lead! } : {}),
    ...(cta ? { cta } : {}),
    ...(configuredString(row.home_branding_before_caption) !== undefined ? { beforeCaption: row.home_branding_before_caption! } : {}),
    ...(configuredString(row.home_branding_after_caption) !== undefined ? { afterCaption: row.home_branding_after_caption! } : {}),
    ...(beforeImageUrl !== undefined ? { beforeImageUrl } : {}),
    ...(configuredString(row.home_branding_before_image_alt) !== undefined ? { beforeImageAlt: row.home_branding_before_image_alt! } : {}),
    ...(typeof row.home_branding_before_image_focal_x === "number" ? { beforeImageFocalX: row.home_branding_before_image_focal_x } : {}),
    ...(typeof row.home_branding_before_image_focal_y === "number" ? { beforeImageFocalY: row.home_branding_before_image_focal_y } : {}),
    ...(afterImageUrl !== undefined ? { afterImageUrl } : {}),
    ...(configuredString(row.home_branding_after_image_alt) !== undefined ? { afterImageAlt: row.home_branding_after_image_alt! } : {}),
    ...(typeof row.home_branding_after_image_focal_x === "number" ? { afterImageFocalX: row.home_branding_after_image_focal_x } : {}),
    ...(typeof row.home_branding_after_image_focal_y === "number" ? { afterImageFocalY: row.home_branding_after_image_focal_y } : {}),
  };
  return Object.keys(mapped).length ? mapped : undefined;
}

function mapHomeShopCampaign(row: HomeRow): HomePatch["shopCampaign"] | undefined {
  const cta = mapCta(row.home_shop_campaign_cta_label ?? null, row.home_shop_campaign_cta_href ?? null);
  const imageUrl = Object.prototype.hasOwnProperty.call(row, "home_shop_campaign_image_url")
    ? normalizeImageUrl(row.home_shop_campaign_image_url)
    : undefined;
  const campaign = {
    ...(configuredString(row.home_shop_campaign_eyebrow) !== undefined ? { eyebrow: row.home_shop_campaign_eyebrow! } : {}),
    ...(configuredString(row.home_shop_campaign_title) !== undefined ? { title: row.home_shop_campaign_title! } : {}),
    ...(configuredString(row.home_shop_campaign_lead) !== undefined ? { lead: row.home_shop_campaign_lead! } : {}),
    ...(imageUrl !== undefined ? { imageUrl } : {}),
    ...(configuredString(row.home_shop_campaign_image_alt) !== undefined ? { imageAlt: row.home_shop_campaign_image_alt! } : {}),
    ...(typeof row.home_shop_campaign_image_focal_x === "number" ? { imageFocalX: row.home_shop_campaign_image_focal_x } : {}),
    ...(typeof row.home_shop_campaign_image_focal_y === "number" ? { imageFocalY: row.home_shop_campaign_image_focal_y } : {}),
    ...(cta ? { cta } : {}),
  };
  return Object.keys(campaign).length > 0 ? campaign : undefined;
}

export function publishedShopCampaignFrames(
  draft: unknown,
  mediaById: ReadonlyMap<string, string>,
): NonNullable<HomePatch["shopCampaign"]>["frames"] {
  const frames = draft && typeof draft === "object"
    ? (draft as { shopCampaign?: { frames?: unknown } }).shopCampaign?.frames
    : undefined;
  if (!Array.isArray(frames)) return [];
  return frames.flatMap((frame) => {
    if (!frame || typeof frame !== "object") return [];
    const placement = frame as { assetId?: unknown; alt?: unknown; focalX?: unknown; focalY?: unknown };
    const assetId = typeof placement.assetId === "string" ? placement.assetId : "";
    const imageUrl = mediaById.get(assetId);
    if (!imageUrl) return [];
    return [{
      imageUrl,
      imageAlt: typeof placement.alt === "string" ? placement.alt : "",
      ...(typeof placement.focalX === "number" ? { imageFocalX: placement.focalX } : {}),
      ...(typeof placement.focalY === "number" ? { imageFocalY: placement.focalY } : {}),
    }];
  });
}

export type StubPatch = {
  featuresHeading?: string;
  features?: { id: string; title: string; text: string }[];
  sections?: { id: string; heading: string; body: string }[];
  documents?: { url: string; title: string }[];
  notice?: { body: string } | null;
  proof?: { imageUrl: string | null; imageAlt: string; imageFocalX?: number; imageFocalY?: number; title: string; text: string } | null;
  cta?: { label: string; href: string; secondaryLabel?: string; secondaryHref?: string } | null;
  footerContact?: {
    phone?: string;
    email?: string;
    address?: string;
    telegram?: string;
    whatsapp?: string;
    max?: string;
    vk?: string;
    instagram?: string;
  };
  /** Present on the contact page only; the footer and legal pages read contacts from here. */
  siteProfile?: SiteProfile;
  seoTitle?: string;
  seoDescription?: string;
  hero: {
    eyebrow?: string;
    title?: string;
    lead?: string;
    imageUrl?: string | null;
    imageAlt?: string;
    imageFocalX?: number;
    imageFocalY?: number;
  };
};

type StubRow = {
  stub_hero_configured?: boolean;
  editorial_configured?: boolean;
  editorial_heading_configured?: boolean;
  editorial_features_configured?: boolean;
  editorial_sections_configured?: boolean;
  editorial_notice_configured?: boolean;
  editorial_proof_configured?: boolean;
  editorial_cta_configured?: boolean;
  editorial_features_heading?: string | null;
  editorial_notice?: string | null;
  editorial_proof_title?: string | null;
  editorial_proof_text?: string | null;
  editorial_proof_image_url?: string | null;
  editorial_proof_image_alt?: string | null;
  editorial_proof_image_focal_x?: number | null;
  editorial_proof_image_focal_y?: number | null;
  editorial_cta_label?: string | null;
  editorial_cta_href?: string | null;
  editorial_secondary_label?: string | null;
  editorial_secondary_href?: string | null;
  features?: { id: string; title: string; text: string }[];
  sections?: { id: string; heading: string; body: string }[];
  documents?: { url: string; title: string }[];
  seo_seo_title: string | null;
  seo_seo_description: string | null;
  stub_hero_eyebrow: string | null;
  stub_hero_title: string | null;
  stub_hero_lead: string | null;
  stub_hero_image_url?: string | null;
  stub_hero_image_alt: string | null;
  stub_hero_image_focal_x?: number | null;
  stub_hero_image_focal_y?: number | null;
  footer_phone?: string | null;
  footer_email?: string | null;
  footer_address?: string | null;
  footer_telegram?: string | null;
  footer_whatsapp?: string | null;
  footer_max?: string | null;
  footer_vk?: string | null;
  footer_instagram?: string | null;
  site_profile?: SiteProfile;
};

export function mapStubPatch(row: StubRow): StubPatch {
  const hero = row.stub_hero_configured
    ? {
        eyebrow: row.stub_hero_eyebrow ?? "",
        title: row.stub_hero_title ?? "",
        lead: row.stub_hero_lead ?? "",
        imageUrl: publicImageUrl(row.stub_hero_image_url) ?? null,
        imageAlt: row.stub_hero_image_alt ?? "",
        ...(typeof row.stub_hero_image_focal_x === "number" ? { imageFocalX: row.stub_hero_image_focal_x } : {}),
        ...(typeof row.stub_hero_image_focal_y === "number" ? { imageFocalY: row.stub_hero_image_focal_y } : {}),
      }
    : {
        ...(nonEmptyString(row.stub_hero_eyebrow) ? { eyebrow: nonEmptyString(row.stub_hero_eyebrow) } : {}),
        ...(nonEmptyString(row.stub_hero_title) ? { title: nonEmptyString(row.stub_hero_title) } : {}),
        ...(nonEmptyString(row.stub_hero_lead) ? { lead: nonEmptyString(row.stub_hero_lead) } : {}),
        ...(publicImageUrl(row.stub_hero_image_url) ? { imageUrl: publicImageUrl(row.stub_hero_image_url) } : {}),
        ...(nonEmptyString(row.stub_hero_image_alt) ? { imageAlt: nonEmptyString(row.stub_hero_image_alt) } : {}),
        ...(typeof row.stub_hero_image_focal_x === "number" ? { imageFocalX: row.stub_hero_image_focal_x } : {}),
        ...(typeof row.stub_hero_image_focal_y === "number" ? { imageFocalY: row.stub_hero_image_focal_y } : {}),
      };
  const footerContact = {
    ...(nonEmptyString(row.footer_phone ?? null) ? { phone: nonEmptyString(row.footer_phone ?? null)! } : {}),
    ...(nonEmptyString(row.footer_email ?? null) ? { email: nonEmptyString(row.footer_email ?? null)! } : {}),
    ...(nonEmptyString(row.footer_address ?? null) ? { address: nonEmptyString(row.footer_address ?? null)! } : {}),
    ...(nonEmptyString(row.footer_telegram ?? null) ? { telegram: nonEmptyString(row.footer_telegram ?? null)! } : {}),
    ...(nonEmptyString(row.footer_whatsapp ?? null) ? { whatsapp: nonEmptyString(row.footer_whatsapp ?? null)! } : {}),
    ...(nonEmptyString(row.footer_max ?? null) ? { max: nonEmptyString(row.footer_max ?? null)! } : {}),
    ...(nonEmptyString(row.footer_vk ?? null) ? { vk: nonEmptyString(row.footer_vk ?? null)! } : {}),
    ...(nonEmptyString(row.footer_instagram ?? null) ? { instagram: nonEmptyString(row.footer_instagram ?? null)! } : {}),
  };
  return {
    ...(row.documents !== undefined ? { documents: row.documents } : {}),
    ...(Object.keys(footerContact).length > 0 ? { footerContact } : {}),
    ...(row.site_profile ? { siteProfile: row.site_profile } : {}),
    ...(row.editorial_configured ? {
      ...(row.editorial_heading_configured ? { featuresHeading: row.editorial_features_heading ?? "" } : {}),
      ...(row.editorial_features_configured ? { features: row.features ?? [] } : {}),
      ...(row.editorial_sections_configured ? { sections: row.sections ?? [] } : {}),
      ...(row.editorial_notice_configured ? { notice: row.editorial_notice ? { body: row.editorial_notice } : null } : {}),
      ...(row.editorial_proof_configured ? { proof: row.editorial_proof_title || row.editorial_proof_text || row.editorial_proof_image_url ? { imageUrl: publicImageUrl(row.editorial_proof_image_url) ?? null, imageAlt: row.editorial_proof_image_alt ?? "", ...(typeof row.editorial_proof_image_focal_x === "number" ? { imageFocalX: row.editorial_proof_image_focal_x } : {}), ...(typeof row.editorial_proof_image_focal_y === "number" ? { imageFocalY: row.editorial_proof_image_focal_y } : {}), title: row.editorial_proof_title ?? "", text: row.editorial_proof_text ?? "" } : null } : {}),
      ...(row.editorial_cta_configured ? { cta: row.editorial_cta_label && row.editorial_cta_href ? { label: row.editorial_cta_label, href: row.editorial_cta_href, secondaryLabel: row.editorial_secondary_label ?? "", secondaryHref: row.editorial_secondary_href ?? "" } : null } : {}),
    } : {}),
    ...(configuredString(row.seo_seo_title) !== undefined ? { seoTitle: row.seo_seo_title! } : {}),
    ...(configuredString(row.seo_seo_description) !== undefined ? { seoDescription: row.seo_seo_description! } : {}),
    hero,
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
    imageUrl?: string | null;
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

const optionalText = (value: string | null | undefined): string | undefined => value ?? undefined;
const isConfiguredText = (value: string | null | undefined): value is string => value !== null && value !== undefined;

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
    ...(isConfiguredText(row.shop_wheels_intro_kicker) ? { kicker: row.shop_wheels_intro_kicker } : {}),
    ...(isConfiguredText(row.shop_wheels_intro_eyebrow) ? { eyebrow: row.shop_wheels_intro_eyebrow } : {}),
    ...(isConfiguredText(row.shop_wheels_intro_title) ? { title: row.shop_wheels_intro_title } : {}),
    ...(isConfiguredText(row.shop_wheels_intro_lead) ? { lead: row.shop_wheels_intro_lead } : {}),
  };
  const vehicleShell = {
    ...(isConfiguredText(row.shop_vehicles_eyebrow) ? { eyebrow: row.shop_vehicles_eyebrow } : {}),
    ...(isConfiguredText(row.shop_vehicles_title) ? { title: row.shop_vehicles_title } : {}),
    ...(isConfiguredText(row.shop_vehicles_lead) ? { lead: row.shop_vehicles_lead } : {}),
    ...(vehiclesCta ? { cta: vehiclesCta } : {}),
  };

  return {
    ...(isConfiguredText(row.seo_seo_title) ? { seoTitle: row.seo_seo_title } : {}),
    ...(isConfiguredText(row.seo_seo_description) ? { seoDescription: row.seo_seo_description } : {}),
    hero: {
      ...(isConfiguredText(row.shop_hero_eyebrow) ? { eyebrow: row.shop_hero_eyebrow } : {}),
      ...(isConfiguredText(row.shop_hero_title) ? { title: row.shop_hero_title } : {}),
      ...(isConfiguredText(row.shop_hero_lead) ? { lead: row.shop_hero_lead } : {}),
      ...(Object.prototype.hasOwnProperty.call(row, "shop_hero_image_url")
        ? { imageUrl: normalizeImageUrl(row.shop_hero_image_url) }
        : {}),
      ...(isConfiguredText(row.shop_hero_image_alt) ? { imageAlt: row.shop_hero_image_alt } : {}),
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
        ...(isConfiguredText(row.shop_catalog_eyebrow) ? { eyebrow: row.shop_catalog_eyebrow } : {}),
        ...(isConfiguredText(row.shop_catalog_title) ? { title: row.shop_catalog_title } : {}),
        ...(isConfiguredText(row.shop_catalog_lead) ? { lead: row.shop_catalog_lead } : {}),
        ...(isConfiguredText(row.shop_catalog_section_title) ? { sectionTitle: row.shop_catalog_section_title } : {}),
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
        carouselVisible: tile.carousel_visible === true,
        ...(optionalText(tile.icon_alt) ? { iconAlt: optionalText(tile.icon_alt) } : {}),
        ...(optionalText(tile.image_alt) ? { imageAlt: optionalText(tile.image_alt) } : {}),
        ...(optionalText(tile.carousel_image_alt) ? { carouselImageAlt: optionalText(tile.carousel_image_alt) } : {}),
      })),
    },
  };
}
