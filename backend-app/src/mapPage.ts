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
  };
};

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
    },
  };
}
