"use client";

import Image from "next/image";
import Link from "next/link";

import { SiteArrow } from "@/components/SiteArrow/SiteArrow";
import { shopCampaignFrames, type ShopCampaignFrame } from "@/lib/content/pages/shopCampaignFrames";
import type { HomeShopCarouselItem } from "@/lib/content/homeShopCarousel";
import type { HomeShopCampaignContent } from "@/lib/content/pages/types";
import { responsiveFocalStyle } from "@/lib/content/responsiveFocalPosition";

import { HOME_SHOP_ZONE_SECTION_ID } from "./homeShopZone";
import { HomeShopIconCarousel } from "./HomeShopIconCarousel";
import styles from "./MainHome.module.css";

function ShopCampaignBackground({ frame }: { frame?: ShopCampaignFrame }) {
  if (!frame) return null;
  return (
    <div className={styles.shopMedia} data-static-background="">
      <Image
        src={frame.imageUrl}
        alt=""
        fill
        sizes="100vw"
        priority={false}
        className="responsiveFocalImage"
        style={responsiveFocalStyle(frame.imageFocalByViewport, frame.imageFocalX, frame.imageFocalY)}
      />
    </div>
  );
}

export function ShopCampaign({ content, carouselItems }: { content: HomeShopCampaignContent; carouselItems: HomeShopCarouselItem[] }) {
  const frames = shopCampaignFrames(content);

  return (
    <div className={styles.shopLead}>
      <section
        id={HOME_SHOP_ZONE_SECTION_ID}
        className={styles.shopCampaign}
        data-home-tone="dark"
        data-canvas-tone="dark"
        data-main-chrome-tone="dark"
        aria-label={content.title}
      >
        <ShopCampaignBackground frame={frames[0]} />
        <div className={styles.shopOverlay} aria-hidden="true" />
        <div className={styles.inner}>
          <div className={styles.shopCampaignCopy}>
            <HomeShopIconCarousel items={carouselItems} />
            {content.eyebrow ? <p className={styles.eyebrow}>{content.eyebrow}</p> : null}
            <h2>{content.title}</h2>
            {content.cta.label.trim() && content.cta.href.trim() ? (
              <Link className={`btn-accent ${styles.shopCta}`} href={content.cta.href}>
                {content.cta.label} <SiteArrow />
              </Link>
            ) : null}
          </div>
        </div>
      </section>
    </div>
  );
}
