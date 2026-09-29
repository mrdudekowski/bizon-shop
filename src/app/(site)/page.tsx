import { BrandingCampaign } from "@/components/main/BrandingCampaign";
import { ExpertiseSupport } from "@/components/main/ExpertiseSupport";
import { HomeShopZoneCanvas } from "@/components/main/HomeShopZoneCanvas";
import { MainHero } from "@/components/main/MainHero";
import { ShopCampaign } from "@/components/main/ShopCampaign";
import { TireDirectionShowcase } from "@/components/main/TireDirectionShowcase";
import { getHeroTireSlides } from "@/lib/catalog/heroTireSlides";
import { getPageContent, getPublishedTireCatalog } from "@/lib/content";

import styles from "@/components/main/MainHome.module.css";

export default async function HomePage() {
  const [page, catalog] = await Promise.all([
    getPageContent("home"),
    getPublishedTireCatalog(),
  ]);

  return (
    <div className={styles.homeShell} data-home-shell="">
      <HomeShopZoneCanvas />
      <MainHero content={page.hero} slides={getHeroTireSlides(catalog)} />
      <TireDirectionShowcase catalog={catalog} content={page.directions} />
      <BrandingCampaign />
      <ShopCampaign content={page.shopCampaign} />
      <ExpertiseSupport content={page.expertise} />
    </div>
  );
}
