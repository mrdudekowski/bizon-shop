"use client";

import { useEffect, useState } from "react";
import { BrandingCampaign } from "@/components/main/BrandingCampaign";
import { ExpertiseSupport } from "@/components/main/ExpertiseSupport";
import { MainHero } from "@/components/main/MainHero";
import { ShopCampaign } from "@/components/main/ShopCampaign";
import { TireDirectionShowcase } from "@/components/main/TireDirectionShowcase";
import type { TireCatalogReadModel } from "@/lib/catalog/tireReadModel";
import { fetchBrowserPublishedJson } from "@/lib/content/browserPublishedClient";
import { readPublishedRevision } from "@/lib/content/readPublishedRevision";
import { getPageDefaults } from "@/lib/content/pages/defaults";
import { mergeHomeContent } from "@/lib/content/pages/merge";
import type { HomePageContent } from "@/lib/content/pages/types";
import styles from "./MainHome.module.css";

export function HomeContentRuntime({
  initialPage,
  initialCatalog,
}: {
  initialPage: HomePageContent;
  initialCatalog: TireCatalogReadModel | null;
}) {
  const [page, setPage] = useState(initialPage);
  const [catalog] = useState(initialCatalog);

  useEffect(() => {
    const controller = new AbortController();
    void readPublishedRevision(controller.signal)
      .then((refresh) => {
        if (!refresh || controller.signal.aborted) return null;
        return fetchBrowserPublishedJson<Parameters<typeof mergeHomeContent>[1]>("/v1/pages/home", controller.signal);
      })
      .then((patch) => {
        if (!patch || controller.signal.aborted) return;
        setPage(mergeHomeContent(getPageDefaults("home"), patch));
      })
      .catch((error: unknown) => {
        if (!controller.signal.aborted) console.warn("Could not refresh published home content; showing generated content.", error);
      });
    return () => controller.abort();
  }, []);

  return (
    <div className={styles.homeShell} data-home-shell="" data-canvas-page="">
      <MainHero content={page.hero} />
      <TireDirectionShowcase catalog={catalog} content={page.directions} />
      <BrandingCampaign content={page.branding} />
      <ShopCampaign content={page.shopCampaign} />
      <ExpertiseSupport content={page.expertise} />
    </div>
  );
}
