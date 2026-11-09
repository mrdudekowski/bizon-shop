import { contactHref, type SiteProfile } from "@/lib/content/siteProfile";
import { PUBLIC_LOGO } from "@/lib/readiness/publicSite";
import { absolutePublicUrl, canonicalUrl, getSiteUrl } from "./metadata";

export type ProductOfferInput = {
  price: number;
  available: boolean;
};

export type ProductStructuredDataInput = {
  name: string;
  description?: string;
  path: string;
  brand?: string;
  category?: string;
  image?: string | null;
  sku?: string | null;
  offer?: ProductOfferInput;
};

type PricedVariant = {
  price?: number;
  priceOnRequest: boolean;
  available: boolean;
};

/** JSON.stringify leaves `<` intact, which can close a script element. */
export function jsonLdScriptContent(data: unknown): string {
  return JSON.stringify(data).replaceAll("<", "\\u003c");
}

/** The price already painted on the page. "По запросу" and a missing number produce no offer. */
export function visibleProductOffer(
  price: number | null | undefined,
  priceOnRequest: boolean,
  available: boolean,
): ProductOfferInput | undefined {
  if (priceOnRequest || typeof price !== "number" || !Number.isFinite(price)) return undefined;
  return { price, available };
}

/** A tire or wheel page shows one price only when a single variant is already selected. */
export function singleVariantOffer(
  variants: PricedVariant[],
  modelAvailable: boolean | undefined,
): ProductOfferInput | undefined {
  if (variants.length !== 1) return undefined;
  const variant = variants[0];
  return visibleProductOffer(variant.price, variant.priceOnRequest, (modelAvailable ?? true) && variant.available);
}

export function createProductStructuredData(product: ProductStructuredDataInput) {
  const description = product.description?.trim();
  const brandName = product.brand?.trim() || "BIZON";
  const url = canonicalUrl(getSiteUrl(), product.path);
  const image = absolutePublicUrl(product.image);
  const sku = product.sku?.trim();

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    ...(description ? { description } : {}),
    brand: {
      "@type": "Brand",
      name: brandName,
    },
    ...(product.category?.trim() ? { category: product.category.trim() } : {}),
    ...(image ? { image } : {}),
    ...(sku ? { sku } : {}),
    url,
    ...(product.offer
      ? {
          offers: {
            "@type": "Offer",
            price: product.offer.price,
            priceCurrency: "RUB",
            availability: product.offer.available
              ? "https://schema.org/InStock"
              : "https://schema.org/PreOrder",
            url,
          },
        }
      : {}),
  };
}

export function shopProductBreadcrumbs(product: { categorySlug: string }) {
  return [
    { href: "/shop", label: "Shop" },
    { href: `/shop/${product.categorySlug}`, label: product.categorySlug },
  ];
}

export function wheelModelBreadcrumbs(model: {
  typeSlug: string;
  typeName: string;
  modelPath: string;
  modelName: string;
}) {
  return [
    { href: "/", label: "Главная" },
    { href: "/shop", label: "Магазин" },
    { href: `/shop/wheels/${model.typeSlug}`, label: model.typeName },
    { href: model.modelPath, label: model.modelName },
  ];
}

export function tireIqBreadcrumbs(article: { slug: string; title: string }) {
  return [
    { href: "/", label: "Главная" },
    { href: "/tire-iq", label: "Tire IQ" },
    { href: `/tire-iq/${article.slug}`, label: article.title },
  ];
}

function publishedCalendarDate(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  if (!trimmed || !/^\d{4}-\d{2}-\d{2}/.test(trimmed) || Number.isNaN(Date.parse(trimmed))) return undefined;
  return trimmed;
}

export function createArticleStructuredData(article: {
  title: string;
  excerpt?: string;
  path: string;
  publishedAt?: string;
  image?: string | null;
}) {
  const description = article.excerpt?.trim();
  const datePublished = publishedCalendarDate(article.publishedAt);
  const image = absolutePublicUrl(article.image);
  const publisherUrl = canonicalUrl(getSiteUrl(), "/");
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    ...(description ? { description } : {}),
    ...(datePublished ? { datePublished } : {}),
    ...(image ? { image } : {}),
    publisher: {
      "@type": "Organization",
      name: "Bizon Tires",
      url: publisherUrl,
    },
    mainEntityOfPage: canonicalUrl(getSiteUrl(), article.path),
  };
}

export function createBreadcrumbStructuredData(items: { href: string; label: string }[]) {
  const siteUrl = getSiteUrl();
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.label,
      item: canonicalUrl(siteUrl, item.href),
    })),
  };
}

/** Placeholder sentences are not contact data, so they never reach the contact point. */
export function createOrganizationStructuredData(contacts: Pick<SiteProfile, "phone" | "email">) {
  const siteUrl = getSiteUrl();
  const hasPhone = contactHref("phone", contacts.phone) !== null;
  const hasEmail = contactHref("email", contacts.email) !== null;

  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Bizon Tires",
    url: canonicalUrl(siteUrl, "/"),
    logo: absolutePublicUrl(PUBLIC_LOGO, siteUrl) ?? `${siteUrl}${PUBLIC_LOGO}`,
    ...(hasPhone || hasEmail
      ? {
          contactPoint: {
            "@type": "ContactPoint",
            contactType: "sales",
            ...(hasEmail ? { email: contacts.email.trim() } : {}),
            ...(hasPhone ? { telephone: contacts.phone.trim() } : {}),
            availableLanguage: ["Russian"],
          },
        }
      : {}),
  };
}
