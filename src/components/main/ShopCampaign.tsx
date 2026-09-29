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
        aria-label="BIZON SHOP"
      >
        <div className={styles.shopMedia}>
          <Image
            src={content.imageUrl}
            alt={content.imageAlt}
            fill
            sizes="100vw"
          />
        </div>
        <div className={styles.shopOverlay} aria-hidden="true" />
        <div className={styles.inner}>
          <Link className={`btn-accent ${styles.shopCta}`} href={content.cta.href}>
            BIZON SHOP <SiteArrow />
          </Link>
        </div>
      </section>
    </div>
  );
}
