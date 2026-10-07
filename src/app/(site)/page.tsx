import { BrandingCampaign } from "@/components/main/BrandingCampaign";
import { ExpertiseSupport } from "@/components/main/ExpertiseSupport";
import { HomeShopZoneCanvas } from "@/components/main/HomeShopZoneCanvas";
import { MainHero } from "@/components/main/MainHero";
import { ShopCampaign } from "@/components/main/ShopCampaign";
import { TireDirectionShowcase } from "@/components/main/TireDirectionShowcase";
import { getPageContent, getPublishedTireCatalog } from "@/lib/content";
import { loadPublished } from "@/lib/content/loadPublished";

import styles from "@/components/main/MainHome.module.css";

export default async function HomePage() {
  const [page, catalogResult] = await Promise.all([
    getPageContent("home"),
    loadPublished(getPublishedTireCatalog),
  ]);
  const catalog = catalogResult.kind === "ok" ? catalogResult.value : null;

  return (
    <div className={styles.homeShell} data-home-shell="">
      <HomeShopZoneCanvas />
      <MainHero content={page.hero} />
      <TireDirectionShowcase catalog={catalog} content={page.directions} />
      <BrandingCampaign />
      <ShopCampaign content={page.shopCampaign} />
      <ExpertiseSupport content={page.expertise} />
    </div>
  );
}
