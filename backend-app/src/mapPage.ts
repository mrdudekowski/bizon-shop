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
  };
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
