"use client";

import { useEffect, useMemo, useState } from "react";
import { BrandingCampaign } from "@/components/main/BrandingCampaign";
import { ExpertiseSupport } from "@/components/main/ExpertiseSupport";
import { MainHero } from "@/components/main/MainHero";
import { ShopCampaign } from "@/components/main/ShopCampaign";
import { TireDirectionShowcase } from "@/components/main/TireDirectionShowcase";
import type { TireCatalogReadModel } from "@/lib/catalog/tireReadModel";
import { fetchBrowserPublishedJson } from "@/lib/content/browserPublishedClient";
import { readPublishedRevision } from "@/lib/content/readPublishedRevision";
import { getPageDefaults } from "@/lib/content/pages/defaults";
import { mergeHomeContent, mergeShopHomeContent } from "@/lib/content/pages/merge";
import type { HomePageContent, ShopHomePageContent } from "@/lib/content/pages/types";
import { buildHomeShopCarouselItems } from "@/lib/content/homeShopCarousel";
import styles from "./MainHome.module.css";

export function HomeContentRuntime({
  initialPage,
  initialShopHome,
  initialCatalog,
}: {
  initialPage: HomePageContent;
  initialShopHome: ShopHomePageContent;
  initialCatalog: TireCatalogReadModel | null;
}) {
  const [page, setPage] = useState(initialPage);
  const [shopHome, setShopHome] = useState(initialShopHome);
  const [catalog] = useState(initialCatalog);
  const carouselItems = useMemo(() => buildHomeShopCarouselItems(shopHome), [shopHome]);

  useEffect(() => {
    const controller = new AbortController();
    void readPublishedRevision(controller.signal)
      .then((refresh) => {
        if (!refresh || controller.signal.aborted) return null;
        return Promise.all([
          fetchBrowserPublishedJson<Parameters<typeof mergeHomeContent>[1]>("/v1/pages/home", controller.signal),
          fetchBrowserPublishedJson<Parameters<typeof mergeShopHomeContent>[1]>("/v1/pages/shop-home", controller.signal),
        ]);
      })
      .then((patches) => {
        if (!patches || controller.signal.aborted) return;
        const [homePatch, shopHomePatch] = patches;
        if (!homePatch || !shopHomePatch) return;
        setPage(mergeHomeContent(getPageDefaults("home"), homePatch));
        setShopHome(mergeShopHomeContent(getPageDefaults("shop-home"), shopHomePatch));
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
      <ShopCampaign content={page.shopCampaign} carouselItems={carouselItems} />
      <ExpertiseSupport content={page.expertise} />
    </div>
  );
}
