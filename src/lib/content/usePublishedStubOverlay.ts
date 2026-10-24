"use client";

import { useEffect, useState } from "react";
import { fetchBrowserPublishedJson } from "@/lib/content/browserPublishedClient";
import type { PublishedStubOverlay } from "@/lib/content/getPageContent";

/** Keep generated page content visible while refreshing the published overlay on page load. */
export function usePublishedStubOverlay(
  key: string,
  initial: PublishedStubOverlay | null,
): PublishedStubOverlay | null {
  const [page, setPage] = useState(initial);

  useEffect(() => {
    if (!key) return;
    const controller = new AbortController();
    void fetchBrowserPublishedJson<PublishedStubOverlay>(
      `/v1/pages/${encodeURIComponent(key)}`,
      controller.signal,
    ).then(setPage).catch((error: unknown) => {
      if (!controller.signal.aborted) {
        console.warn(`Could not refresh published page ${key}; showing generated content.`, error);
      }
    });
    return () => controller.abort();
  }, [key]);

  return page;
}
