"use client";

import { useEffect, useState } from "react";

export type CatalogView = "list" | "tiles";

const STORAGE_PREFIX = "bizon.cms.catalog-view.";

function isCatalogView(value: string | null): value is CatalogView {
  return value === "list" || value === "tiles";
}

export function useCatalogView(sectionKey: string, itemCount: number) {
  const [savedView, setSavedView] = useState<CatalogView | null>(null);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(`${STORAGE_PREFIX}${sectionKey}`);
      setSavedView(isCatalogView(stored) ? stored : null);
    } catch {
      setSavedView(null);
    }
  }, [sectionKey]);

  function setView(view: CatalogView) {
    setSavedView(view);
    try {
      window.localStorage.setItem(`${STORAGE_PREFIX}${sectionKey}`, view);
    } catch {
      // Keep the selection for this session when browser storage is unavailable.
    }
  }

  return {
    view: savedView ?? (itemCount <= 6 ? "tiles" : "list"),
    setView,
  };
}
