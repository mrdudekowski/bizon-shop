import type { PageKey } from "../keys";
import { getPageRegistryEntry } from "../registry";
import type { StubMarketingPageContent } from "../types";

export function stubPageDefaults(
  key: Exclude<PageKey, "home" | "shop-home">,
): StubMarketingPageContent {
  const entry = getPageRegistryEntry(key);
  return {
    key,
    hero: {
      eyebrow: "BIZON",
      title: entry.title,
      lead: "",
      imageUrl: null,
      imageAlt: entry.title,
    },
  };
}
