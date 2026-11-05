"use client";

import { createContext, useContext, type ReactNode } from "react";

import type { SiteProfile } from "@/lib/content/siteProfile";

const SiteProfileContext = createContext<SiteProfile | null>(null);

export function SiteProfileProvider({ value, children }: { value: SiteProfile | null; children: ReactNode }) {
  return <SiteProfileContext.Provider value={value}>{children}</SiteProfileContext.Provider>;
}

export function useSiteProfile(): SiteProfile | null {
  return useContext(SiteProfileContext);
}
