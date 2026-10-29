import { contactHref, type SiteProfile } from "@/lib/content/siteProfile";
import { PUBLIC_LOGO } from "@/lib/readiness/publicSite";
import { getSiteUrl } from "./metadata";

export type ProductStructuredDataInput = {
  name: string;
  description?: string;
  path: string;
  brand?: string;
  category?: string;
};

export function createProductStructuredData(product: ProductStructuredDataInput) {
  const siteUrl = getSiteUrl();
  const path = product.path.startsWith("/") ? product.path : `/${product.path}`;

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    brand: {
      "@type": "Brand",
      name: product.brand ?? "BIZON",
    },
    category: product.category,
    url: `${siteUrl}${path}`,
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
    url: siteUrl,
    logo: `${siteUrl}${PUBLIC_LOGO}`,
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
