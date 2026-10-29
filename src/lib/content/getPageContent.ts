import { getPageDefaults, stubPageDefaults } from "./pages/defaults";
import type { PageKey } from "./pages/keys";
import { mergeHomeContent, mergeShopHomeContent } from "./pages/merge";
import type { HomePageContent, PageContentByKey, ShopHomePageContent } from "./pages/types";
import { fetchPublishedJson, isStaticBuild, PublishedApiError, publishedApiEnabled } from "./publishedClient";
import type { SiteProfile } from "./siteProfile";

export type PublishedStubOverlay = {
  documents?: { url: string; title: string }[];
  featuresHeading?: string;
  features?: { id: string; title: string; text: string }[];
  sections?: { id: string; heading: string; body: string }[];
  notice?: { body: string } | null;
  proof?: { imageUrl?: string | null; imageAlt?: string; imageFocalX?: number; imageFocalY?: number; title: string; text: string } | null;
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
  /** Served with the contact page only. */
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

const STUB_KEYS = new Set([
  "about",
  "contact",
  "warranty",
  "branding",
  "become-a-supplier",
  "privacy-policy",
  "shop-delivery-returns",
]);

export async function getPublishedStubOverlay(key: string): Promise<PublishedStubOverlay | null> {
  if (!STUB_KEYS.has(key)) return null;
  if (!publishedApiEnabled()) {
    if (isStaticBuild()) throw new Error("CONTENT_API_URL is required to build the static public site.");
    const fallback = stubPageDefaults(key as Exclude<PageKey, "home" | "shop-home">);
    return {
      hero: fallback.hero,
    };
  }
  const overlay = await fetchPublishedJson<PublishedStubOverlay>(`/v1/pages/${encodeURIComponent(key)}`);
  if (overlay) return overlay;
  const fallback = stubPageDefaults(key as Exclude<PageKey, "home" | "shop-home">);
  return {
    hero: fallback.hero,
  };
}

async function fetchRequiredPagePatch<T>(key: "home" | "shop-home", path: string): Promise<T> {
  const patch = await fetchPublishedJson<T>(path);
  if (patch === null) {
    const route = key === "home" ? "/" : "/shop";
    throw new PublishedApiError("not_found", `Required public route ${route} is missing CMS page ${key}.`);
  }
  return patch;
}

type HomePatch = Parameters<typeof mergeHomeContent>[1];
type ShopHomePatch = Parameters<typeof mergeShopHomeContent>[1];

/** Stage 1: code defaults, optionally merged with backend-app for home and shop-home. */
export async function getPageContent<K extends PageKey>(
  key: K,
): Promise<PageContentByKey[K]> {
  const defaults = getPageDefaults(key);

  if (!publishedApiEnabled()) {
    if (isStaticBuild()) throw new Error("CONTENT_API_URL is required to build the static public site.");
    return defaults;
  }

  if (key === "home") {
    const patch = await fetchRequiredPagePatch<HomePatch>("home", "/v1/pages/home");
    return mergeHomeContent(defaults as HomePageContent, patch) as PageContentByKey[K];
  }

  if (key === "shop-home") {
    const patch = await fetchRequiredPagePatch<ShopHomePatch>("shop-home", "/v1/pages/shop-home");
    return mergeShopHomeContent(defaults as ShopHomePageContent, patch) as PageContentByKey[K];
  }

  return defaults;
}
