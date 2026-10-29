"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

import { SiteArrow } from "@/components/SiteArrow/SiteArrow";
import { shopCampaignFrames, type ShopCampaignFrame } from "@/lib/content/pages/shopCampaignFrames";
import type { HomeShopCampaignContent } from "@/lib/content/pages/types";

import { HOME_SHOP_ZONE_SECTION_ID } from "./homeShopZone";
import styles from "./MainHome.module.css";

const FRAME_MS = 6000;

function ShopCampaignStage({ frames }: { frames: ShopCampaignFrame[] }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const count = frames.length;

  useEffect(() => {
    setActiveIndex(0);
  }, [count]);

  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reducedMotion.matches || count < 2) return undefined;
    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % count);
    }, FRAME_MS);
    return () => window.clearInterval(timer);
  }, [count]);

  return (
    <>
      <div className={styles.shopMedia}>
        {frames.map((frame, index) => (
          <Image
            key={`${frame.imageUrl}-${index}`}
            src={frame.imageUrl}
            alt={index === activeIndex ? frame.imageAlt : ""}
            fill
            sizes="100vw"
            data-active={index === activeIndex ? "true" : "false"}
            style={{ objectPosition: `${(frame.imageFocalX ?? 0.5) * 100}% ${(frame.imageFocalY ?? 0.5) * 100}%` }}
          />
        ))}
      </div>
      {count > 1 ? (
        <div className={styles.shopPager} aria-hidden="true">
          {frames.map((frame, index) => (
            <span key={`${frame.imageUrl}-${index}-pager`} data-active={index === activeIndex ? "true" : "false"}>
              <i />
            </span>
          ))}
        </div>
      ) : null}
    </>
  );
}

export function ShopCampaign({ content }: { content: HomeShopCampaignContent }) {
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
        <ShopCampaignStage frames={frames} />
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
