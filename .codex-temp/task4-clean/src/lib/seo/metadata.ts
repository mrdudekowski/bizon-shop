import type { Metadata } from "next";

const SITE_NAME = "Bizon Tires";
const DEFAULT_DESCRIPTION =
  "Премиальная большегрузная резина BIZON — магистральные, карьерные и внедорожные решения для тяжёлой техники.";

function getSiteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "https://bizontires.example";
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
  const url = `${siteUrl}${path.startsWith("/") ? path : `/${path}`}`;
  const fullTitle = title ? `${title} | ${SITE_NAME}` : `${SITE_NAME} — Премиальная большегрузная резина`;
  const ogImage = image ?? `${siteUrl}/bizon_inverted_hd.svg`;

  return {
    title: fullTitle,
    description,
    metadataBase: new URL(siteUrl),
    alternates: { canonical: url },
    robots: noIndex ? { index: false, follow: false } : { index: true, follow: true },
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
  descriptionShort?: string;
  slug: string;
}) {
  return createPageMetadata({
    title: product.name,
    description: product.descriptionShort ?? DEFAULT_DESCRIPTION,
    path: `/shop/product/${product.slug}`,
  });
}

export { DEFAULT_DESCRIPTION, SITE_NAME, getSiteUrl };
