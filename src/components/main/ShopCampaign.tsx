import Image from "next/image";
import Link from "next/link";

import { SiteArrow } from "@/components/SiteArrow/SiteArrow";
import type { HomeShopCampaignContent } from "@/lib/content/pages/types";

import { HOME_SHOP_ZONE_SECTION_ID } from "./homeShopZone";
import styles from "./MainHome.module.css";

export function ShopCampaign({ content }: { content: HomeShopCampaignContent }) {
  return (
    <div className={styles.shopLead}>
      <img
        className={styles.directionWatermark}
        src="/brand/bizon.svg"
        alt=""
        aria-hidden="true"
        draggable={false}
      />
      <section
        id={HOME_SHOP_ZONE_SECTION_ID}
        className={styles.shopCampaign}
        data-home-tone="dark"
        data-main-chrome-tone="dark"
        aria-label={content.title}
      >
        <div className={styles.shopMedia}>
          {content.imageUrl ? (
            <Image
              src={content.imageUrl}
              alt={content.imageAlt}
              fill
              sizes="100vw"
              style={{ objectPosition: `${(content.imageFocalX ?? 0.5) * 100}% ${(content.imageFocalY ?? 0.5) * 100}%` }}
            />
          ) : null}
        </div>
        <div className={styles.shopOverlay} aria-hidden="true" />
        <div className={styles.inner}>
          <div className={styles.shopCampaignCopy}>
            {content.eyebrow ? <p className={styles.eyebrow}>{content.eyebrow}</p> : null}
            <h2>{content.title}</h2>
            {content.lead ? <p>{content.lead}</p> : null}
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
