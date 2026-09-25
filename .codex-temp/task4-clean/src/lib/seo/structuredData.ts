import { SITE_CONTACT } from "@/constants/contact";
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

export function createOrganizationStructuredData() {
  const siteUrl = getSiteUrl();

  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Bizon Tires",
    url: siteUrl,
    logo: `${siteUrl}/bizon_inverted_hd.svg`,
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "sales",
      email: SITE_CONTACT.email,
      telephone: SITE_CONTACT.phone,
      availableLanguage: ["Russian"],
    },
  };
}
