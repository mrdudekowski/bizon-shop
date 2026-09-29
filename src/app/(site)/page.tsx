import { ExpertiseSupport } from "@/components/main/ExpertiseSupport";
import { HomeShopZoneCanvas } from "@/components/main/HomeShopZoneCanvas";
import { MainHero } from "@/components/main/MainHero";
import { ShopCampaign } from "@/components/main/ShopCampaign";
import { TireDirectionShowcase } from "@/components/main/TireDirectionShowcase";
import { getHeroTireSlides } from "@/lib/catalog/heroTireSlides";
import {
  getPageContent,
  getPeopleStories,
  getPublishedTireCatalog,
  getTireIQArticles,
} from "@/lib/content";

import styles from "@/components/main/MainHome.module.css";

export default async function HomePage() {
  const [page, catalog, articles, stories] = await Promise.all([
    getPageContent("home"),
    getPublishedTireCatalog(),
    getTireIQArticles(),
    getPeopleStories(),
  ]);

  return (
    <div className={styles.homeShell} data-home-shell="">
      <HomeShopZoneCanvas />
      <MainHero content={page.hero} slides={getHeroTireSlides(catalog)} />
      <TireDirectionShowcase catalog={catalog} content={page.directions} />
      <ShopCampaign content={page.shopCampaign} />
      <ExpertiseSupport
        article={articles[0]}
        story={stories[0]}
        content={page.expertise}
      />
    </div>
  );
}
