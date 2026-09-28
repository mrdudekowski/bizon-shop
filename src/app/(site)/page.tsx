import { Suspense } from "react";

import { ExpertiseSupport } from "@/components/main/ExpertiseSupport";
import { MainHero } from "@/components/main/MainHero";
import { ShopCampaign } from "@/components/main/ShopCampaign";
import { TireDirectionShowcase } from "@/components/main/TireDirectionShowcase";
import { TireSelectionEntry } from "@/components/main/TireSelectionEntry";
import { getHeroTireSlides } from "@/lib/catalog/heroTireSlides";
import {
  getPageContent,
  getPeopleStories,
  getPublishedTireCatalog,
  getTireIQArticles,
} from "@/lib/content";

export default async function HomePage() {
  const [page, catalog, articles, stories] = await Promise.all([
    getPageContent("home"),
    getPublishedTireCatalog(),
    getTireIQArticles(),
    getPeopleStories(),
  ]);

  return (
    <>
      <MainHero content={page.hero} slides={getHeroTireSlides(catalog)} />
      <Suspense fallback={null}>
        <TireSelectionEntry content={page.selectionEntry} catalog={catalog} />
      </Suspense>
      <TireDirectionShowcase catalog={catalog} content={page.directions} />
      <ShopCampaign content={page.shopCampaign} />
      <ExpertiseSupport
        article={articles[0]}
        story={stories[0]}
        content={page.expertise}
      />
    </>
  );
}
