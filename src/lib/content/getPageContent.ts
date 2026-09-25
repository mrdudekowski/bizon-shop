import { getPageDefaults } from "./pages/defaults";
import type { PageKey } from "./pages/keys";
import { mergeHomeContent } from "./pages/merge";
import type { HomePageContent, PageContentByKey } from "./pages/types";
import { fetchPublishedJson, publishedApiEnabled } from "./publishedClient";

export type PublishedStubOverlay = {
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
  if (!publishedApiEnabled() || !STUB_KEYS.has(key)) return null;
  return fetchPublishedJson<PublishedStubOverlay>(`/v1/pages/${encodeURIComponent(key)}`);
}

type HomePatch = Parameters<typeof mergeHomeContent>[1];

/** Stage 1: code defaults, optionally merged with backend-app for home. */
export async function getPageContent<K extends PageKey>(
  key: K,
): Promise<PageContentByKey[K]> {
  const defaults = getPageDefaults(key);

  if (key !== "home" || !publishedApiEnabled()) {
    return defaults;
  }

  const patch = await fetchPublishedJson<HomePatch>("/v1/pages/home");
  if (!patch) {
    return defaults;
  }

  return mergeHomeContent(defaults as HomePageContent, patch) as PageContentByKey[K];
}
