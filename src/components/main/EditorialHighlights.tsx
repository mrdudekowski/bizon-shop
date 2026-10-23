import Image from "next/image";
import Link from "next/link";

import { SiteArrow } from "@/components/SiteArrow/SiteArrow";
import type { HomeExpertiseContent } from "@/lib/content/pages/types";

import styles from "./MainHome.module.css";

export function EditorialHighlights({ content }: { content: HomeExpertiseContent }) {
  return (
    <div className={styles.editorial}>
      <div className={styles.expertiseBanner}>
        {content.imageUrl ? (
          <Image
            className={styles.expertiseBannerImage}
            src={content.imageUrl}
            alt={content.imageAlt}
            fill
            sizes="100vw"
            priority={false}
          />
        ) : null}
        <div className={styles.expertiseBannerContent}>
          {content.eyebrow ? <p className={styles.expertiseBannerEyebrow}>{content.eyebrow}</p> : null}
          <h2 id="expertise-support-title">{content.title}</h2>
          {content.lead ? <p className={styles.expertiseBannerLead}>{content.lead}</p> : null}
          {content.cta.label.trim() && content.cta.href.trim() ? (
            <Link className={`btn-accent ${styles.expertiseCta}`} href={content.cta.href}>
              {content.cta.label} <SiteArrow />
            </Link>
          ) : null}
        </div>
        <span className={styles.expertiseBannerMark} aria-hidden="true">BIZON · TIRE IQ</span>
      </div>
    </div>
  );
}
