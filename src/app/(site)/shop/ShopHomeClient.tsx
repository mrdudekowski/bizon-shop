"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { SiteArrow } from "@/components/SiteArrow/SiteArrow";
import { useLoopingTrack } from "@/components/catalog/useLoopingTrack";
import { HorizontalScrollCue } from "@/components/catalog/HorizontalScrollCue";
import { ShopCategoryShowcase } from "@/components/shop/ShopCategoryShowcase";
import { ShopOrderSteps } from "./ShopOrderSteps";
import type { CmsShopCategory, CmsWheelModel } from "@/lib/content/types";
import type { ShopHomePageContent } from "@/lib/content/pages/types";
import { getPageDefaults } from "@/lib/content/pages/defaults";
import { mergeShopHomeContent } from "@/lib/content/pages/merge";
import { fetchBrowserPublishedJson, fetchBrowserPublishedList } from "@/lib/content/browserPublishedClient";
import { shopHomeCarouselSlides, shopHomeCategoryCards } from "@/lib/content/shopCategoryPresentation";
import styles from "./ShopHome.module.css";

type Props = {
  initialPage: ShopHomePageContent;
  initialModels: CmsWheelModel[];
  initialCategories: CmsShopCategory[];
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function ShopHomeClient({ initialPage, initialModels, initialCategories }: Props) {
  const [page, setPage] = useState(initialPage);
  const [models, setModels] = useState(initialModels);
  const [categories, setCategories] = useState(initialCategories);
  const modelsTrackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const controller = new AbortController();
    const refresh = async () => {
      try {
        const [pagePatch, nextCategories, nextModels] = await Promise.all([
          fetchBrowserPublishedJson<unknown>("/v1/pages/shop-home", controller.signal),
          fetchBrowserPublishedList<CmsShopCategory>("/v1/shop/categories", controller.signal),
          fetchBrowserPublishedList<CmsWheelModel>("/v1/wheels/types/forged/models", controller.signal),
        ]);
        if (!isRecord(pagePatch)) {
          throw new Error("Published Shop content has an invalid shape");
        }
        if (controller.signal.aborted) return;
        setPage(mergeShopHomeContent(
          getPageDefaults("shop-home"),
          pagePatch as Parameters<typeof mergeShopHomeContent>[1],
        ));
        setCategories(nextCategories as CmsShopCategory[]);
        setModels(nextModels as CmsWheelModel[]);
      } catch (error) {
        if (!controller.signal.aborted) {
          console.warn("Could not refresh published Shop content; showing the generated page.", error);
        }
      }
    };

    void refresh();
    return () => controller.abort();
  }, []);

  const homeModels = [...new Map(models.map((model) => [model.slug, model])).values()]
    .filter((model) => model.showInMenu && model.imageUrl)
    .sort((a, b) => a.menuOrder - b.menuOrder)
    .slice(0, 3);
  useLoopingTrack(modelsTrackRef, homeModels.length);
  const categorySlides = shopHomeCarouselSlides(categories, page.catalog.tiles);
  const categoryCards = shopHomeCategoryCards(categories, page.catalog.tiles);

  return (
    <div className={styles.page} data-canvas-page="">
      <section className={styles.hero} data-shop-chrome-tone="dark" data-canvas-tone="dark">
        <div className={styles.heroMedia}>
          {page.hero.imageUrl ? <Image src={page.hero.imageUrl} alt={page.hero.imageAlt} fill priority sizes="100vw" /> : null}
        </div>
        <div className={styles.heroOverlay} />
        <div className={styles.heroContent}>
          <p className={styles.eyebrow}>{page.hero.eyebrow}</p>
          <h1>{page.hero.title}</h1>
          <p className={styles.heroLead}>{page.hero.lead}</p>
          {page.hero.cta.label.trim() && page.hero.cta.href.trim() ? (
            <Link className={styles.heroAction} href={page.hero.cta.href}>{page.hero.cta.label}</Link>
          ) : null}
        </div>
      </section>

      <section className={styles.modelsSection} id="wheels" data-shop-chrome-tone="dark" data-canvas-tone="dark" aria-labelledby="shop-title">
        <div className={styles.content}>
          <div className={styles.modelsIntro}>
            <p className={styles.collectionKicker}>{page.wheelsIntro.kicker}</p>
            <h2 id="shop-title">{page.wheelsIntro.title}</h2>
            <p>{page.wheelsIntro.lead}</p>
          </div>
          <div ref={modelsTrackRef} className={styles.modelGrid}>
            {homeModels.map((model) => (
              <Link className={styles.modelCard} href={`/shop/wheels/forged/${model.slug}`} key={model.slug}>
                <span className={styles.modelMedia}><Image src={model.imageUrl!} alt={model.name} fill sizes="(max-width: 767px) 92vw, 33vw" /></span>
                <span className={styles.modelContent}>
                  <span className={styles.modelStatus}>Изготавливается под заказ</span>
                  <strong>{model.name}</strong>
                  <span>{[model.designStyle, model.series].filter(Boolean).join(" · ")}</span>
                </span>
                <span className={styles.modelArrow} aria-hidden="true"><SiteArrow direction="ne" /></span>
              </Link>
            ))}
            {homeModels.map((model) => (
              <Link className={`${styles.modelCard} ${styles.loopClone}`} href={`/shop/wheels/forged/${model.slug}`} key={`${model.slug}-loop`} aria-hidden="true" tabIndex={-1}>
                <span className={styles.modelMedia}><Image src={model.imageUrl!} alt="" fill sizes="(max-width: 767px) 92vw, 33vw" /></span>
                <span className={styles.modelContent}>
                  <span className={styles.modelStatus}>Изготавливается под заказ</span>
                  <strong>{model.name}</strong>
                  <span>{[model.designStyle, model.series].filter(Boolean).join(" · ")}</span>
                </span>
                <span className={styles.modelArrow} aria-hidden="true"><SiteArrow direction="ne" /></span>
              </Link>
            ))}
          </div>
          {homeModels.length > 1 ? <HorizontalScrollCue trackRef={modelsTrackRef} count={homeModels.length} tone="dark" /> : null}
          <ShopOrderSteps steps={page.orderSteps} />
        </div>
      </section>

      <section className={styles.categoriesSection} id="categories" data-shop-chrome-tone="dark" data-canvas-tone="dark" aria-labelledby="categories-title">
        {categorySlides.length || categoryCards.length ? (
          <ShopCategoryShowcase slides={categorySlides} cards={categoryCards} />
        ) : (
          <div className={styles.content}><div className={styles.categoriesEmpty}>
            <p>Категории появятся здесь после публикации в каталоге.</p>
            <Link href="/shop/wheels/forged">Посмотреть кованые диски <SiteArrow direction="ne" /></Link>
          </div></div>
        )}
      </section>

      <section className={styles.vehiclesSection} data-shop-section="vehicles" data-shop-chrome-tone="light" data-canvas-tone="light" aria-labelledby="vehicles-title">
        <div className={styles.vehiclesInner}>
          <div className={styles.vehiclesHead}>
            <div>
              <p className={styles.darkKicker}>{page.vehicles.eyebrow}</p>
              <h2 id="vehicles-title">{page.vehicles.title}</h2>
              <p>{page.vehicles.lead}</p>
            </div>
            {page.vehicles.cta.label.trim() && page.vehicles.cta.href.trim() ? (
              <Link className={styles.selectionAction} href={page.vehicles.cta.href}>{page.vehicles.cta.label}</Link>
            ) : null}
          </div>
          <div className={styles.vehicleGrid}>
            {page.vehicles.slides.map((story, index) => (
              <figure className={index < 2 ? styles.vehicleFeature : styles.vehicleCard} key={`${story.image}-${index}`}>
                <Image src={story.image} alt={story.alt} fill sizes={index < 2 ? "(max-width: 767px) 100vw, 50vw" : "(max-width: 767px) 100vw, 33vw"} />
                <figcaption>{story.title}</figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
