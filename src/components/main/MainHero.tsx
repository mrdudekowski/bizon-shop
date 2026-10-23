import Image from "next/image";
import Link from "next/link";

import type { HomeHeroContent } from "@/lib/content/pages/types";

import styles from "./MainHome.module.css";

export function MainHero({ content }: { content: HomeHeroContent }) {
  const primaryCta = content.primaryCta.label.trim() && content.primaryCta.href.trim()
    ? content.primaryCta
    : null;
  const secondaryCta = content.secondaryCta.label.trim() && content.secondaryCta.href.trim()
    ? content.secondaryCta
    : null;

  return (
    <section className={styles.hero} data-main-chrome-tone="dark">
      <div className={styles.heroMedia}>
        {content.imageUrl ? (
          <Image
            src={
              content.imageUrl.startsWith("/")
                ? `${content.imageUrl}?v=otr`
                : content.imageUrl
            }
            alt={content.imageAlt}
            fill
            priority
            sizes="100vw"
          />
        ) : null}
      </div>

      <div className={styles.heroOverlay} aria-hidden="true" />

      <div className={styles.inner}>
        <div className={styles.heroCopy}>
          {content.eyebrow ? <p className={styles.eyebrow}>{content.eyebrow}</p> : null}
          <h1>{content.title}</h1>
          <p>{content.lead}</p>
          {primaryCta || secondaryCta ? (
            <div className={styles.heroActions}>
              {primaryCta ? (
                <Link className="btn-accent" href={primaryCta.href}>
                  {primaryCta.label}
                </Link>
              ) : null}
              {secondaryCta ? (
                <Link className="btn-secondary" href={secondaryCta.href}>
                  {secondaryCta.label}
                </Link>
              ) : null}
            </div>
          ) : null}
          {content.metricLabel || content.metricText ? (
            <div className={styles.heroMetric}>
              {content.metricLabel ? <strong>{content.metricLabel}</strong> : null}
              {content.metricText ? <span>{content.metricText}</span> : null}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
