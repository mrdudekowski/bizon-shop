import Link from "next/link";

import { SiteArrow } from "@/components/SiteArrow/SiteArrow";
import { BrandingCompare } from "./BrandingCompare";
import { HOME_SHOP_ZONE_ENTER_ID } from "./homeShopZone";
import type { HomeBrandingContent } from "@/lib/content/pages/types";
import styles from "./MainHome.module.css";

export function BrandingCampaign({ content }: { content: HomeBrandingContent }) {
  const hasComparison = Boolean(content.beforeImageUrl && content.afterImageUrl);

  return (
    <section
      id={HOME_SHOP_ZONE_ENTER_ID}
      className={`section section--dark ${styles.branding}`}
      data-main-chrome-tone="dark"
      aria-labelledby="branding-heading"
    >
      <BrandingCompare
        beforeImageUrl={content.beforeImageUrl}
        beforeImageAlt={content.beforeImageAlt}
        afterImageUrl={content.afterImageUrl}
        afterImageAlt={content.afterImageAlt}
        beforeImageFocalX={content.beforeImageFocalX}
        beforeImageFocalY={content.beforeImageFocalY}
        afterImageFocalX={content.afterImageFocalX}
        afterImageFocalY={content.afterImageFocalY}
      />
      <div className={styles.brandingOverlay} aria-hidden="true" />
      <div className={styles.inner}>
        <div className={styles.brandingCopy}>
          {content.eyebrow ? <p>{content.eyebrow}</p> : null}
          <h2 id="branding-heading">{content.title}</h2>
          <p>{content.lead}</p>
          {content.cta.label && content.cta.href ? <Link className={`btn-accent ${styles.brandingCta}`} href={content.cta.href}>
            {content.cta.label} <SiteArrow />
          </Link> : null}
        </div>
        {hasComparison ? <div className={styles.brandingCaptions} aria-hidden="true">
          <span className={styles.brandingCaption}>{content.beforeCaption}</span>
          <span className={styles.brandingCaptionAfter}>{content.afterCaption}</span>
        </div> : null}
      </div>
    </section>
  );
}
