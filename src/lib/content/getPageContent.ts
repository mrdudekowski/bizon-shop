import { getPageDefaults } from "./pages/defaults";
import type { PageKey } from "./pages/keys";
import { mergeHomeContent } from "./pages/merge";
import type { HomePageContent, PageContentByKey } from "./pages/types";
import { fetchPublishedJson, publishedApiEnabled } from "./publishedClient";

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
