import type { Metadata } from "next";

import { PUBLIC_OG_IMAGE } from "@/lib/readiness/publicSite";

const SITE_NAME = "Bizon Tires";
const DEFAULT_DESCRIPTION =
  "Премиальная большегрузная резина BIZON — магистральные, карьерные и внедорожные решения для тяжёлой техники.";

function getSiteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/+$/, "") ?? "https://bizontires.example";
}

export function canonicalUrl(siteUrl: string, path: string): string {
  const route = new URL(path.startsWith("/") ? path : `/${path}`, `${siteUrl}/`);
  route.pathname = route.pathname.endsWith("/") ? route.pathname : `${route.pathname}/`;
  return route.href;
}

/** Absolute URL for a public file. Encodes `+` so it is not read as a space. */
export function absolutePublicUrl(value: string | null | undefined, siteUrl = getSiteUrl()): string | undefined {
  const trimmed = value?.trim();
  if (!trimmed) return undefined;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (!trimmed.startsWith("/")) return undefined;
  const path = trimmed
    .split("/")
    .map((part, index) => (index === 0 ? "" : encodeURIComponent(part)))
    .join("/");
  return `${siteUrl}${path}`;
}

/** A blank CMS string is missing text, so the page fallback stays in place. */
export function textOrFallback(value: string | null | undefined, fallback: string): string {
  const trimmed = value?.trim();
  return trimmed ? trimmed : fallback;
}

export type PageMetadataInput = {
  title?: string;
  description?: string;
  path?: string;
  image?: string;
  noIndex?: boolean;
};

export function createPageMetadata({
  title,
  description = DEFAULT_DESCRIPTION,
  path = "",
  image,
  noIndex = false,
}: PageMetadataInput = {}): Metadata {
  const siteUrl = getSiteUrl();
  const url = canonicalUrl(siteUrl, path);
  const fullTitle = title === undefined
    ? `${SITE_NAME} — Премиальная большегрузная резина`
    : title.trim()
      ? `${title} | ${SITE_NAME}`
      : SITE_NAME;
  const ogImage = image ?? absolutePublicUrl(PUBLIC_OG_IMAGE, siteUrl);

  return {
    title: fullTitle,
    description,
    metadataBase: new URL(siteUrl),
    alternates: { canonical: url },
    robots: noIndex ? { index: false, follow: true } : { index: true, follow: true },
    openGraph: {
      type: "website",
      locale: "ru_RU",
      url,
      siteName: SITE_NAME,
      title: fullTitle,
      description,
      images: [{ url: ogImage, alt: SITE_NAME }],
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      images: [ogImage],
    },
  };
}

export function createProductMetadata(product: {
  name: string;
  brand?: string;
  descriptionShort?: string;
  seoTitle?: string;
  seoDescription?: string;
  slug: string;
}) {
  return createPageMetadata({
    title: textOrFallback(product.seoTitle, product.name),
    description: productSearchDescription(product),
    path: `/shop/product/${product.slug}`,
  });
}

/** Visible product facts only. A blank CMS description must not become the tire homepage slogan. */
export function productSearchDescription(product: {
  name: string;
  brand?: string;
  descriptionShort?: string;
  seoDescription?: string;
}): string {
  const ownText = textOrFallback(product.seoDescription, product.descriptionShort?.trim() ?? "");
  if (ownText.trim()) return ownText.trim();
  const name = product.name.trim() || "Товар";
  const brand = product.brand?.trim();
  return brand ? `${name} от ${brand} в каталоге BIZON Shop.` : `${name} в каталоге BIZON Shop.`;
}

export { DEFAULT_DESCRIPTION, SITE_NAME, getSiteUrl };
