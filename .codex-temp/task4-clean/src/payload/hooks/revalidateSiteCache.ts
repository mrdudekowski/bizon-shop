import { revalidatePath } from "next/cache";
import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from "payload";

const SITE_PATHS = [
  "/",
  "/models",
  "/shop",
  "/tire-iq",
  "/people-stories",
  "/contact",
] as const;

function safeRevalidatePath(path: string, type?: "layout" | "page"): void {
  try {
    revalidatePath(path, type);
  } catch {
    // ponytail: payload run / CLI has no Next static store — ISR revalidate=60 covers seeds
  }
}

function revalidatePublicSite(): void {
  for (const path of SITE_PATHS) {
    safeRevalidatePath(path);
  }

  safeRevalidatePath("/", "layout");
  safeRevalidatePath("/models", "layout");
  safeRevalidatePath("/shop", "layout");
  safeRevalidatePath("/sitemap.xml");
}

/** Invalidate static pages after catalog/content saves in Payload admin. */
export const revalidateSiteCache: CollectionAfterChangeHook = () => {
  revalidatePublicSite();
};

export const revalidateSiteCacheAfterDelete: CollectionAfterDeleteHook = () => {
  revalidatePublicSite();
};
