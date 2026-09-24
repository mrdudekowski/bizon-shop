import Image from "next/image";
import Link from "next/link";

import type { HomeShopCampaignContent } from "@/lib/content/pages/types";

import styles from "./MainHome.module.css";

export function ShopCampaign({ content }: { content: HomeShopCampaignContent }) {
  return (
    <section
      className={styles.shopCampaign}
      data-home-tone="dark"
      data-main-chrome-tone="dark"
      aria-label={content.title}
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
        <div className={styles.shopCopy}>
          <p className={styles.eyebrow}>{content.eyebrow}</p>
          <h2>{content.title}</h2>
          <p>{content.lead}</p>
          <Link className="btn-accent" href={content.cta.href}>
            {content.cta.label}
          </Link>
        </div>
      </div>
    </section>
  );
}
