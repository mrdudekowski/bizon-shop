"use client";

import Image from "next/image";
import Link from "next/link";

import type { HomeHeroContent } from "@/lib/content/pages/types";

import styles from "./MainHome.module.css";

export function MainHero({ content }: { content: HomeHeroContent }) {
  const hero = content;

  const primaryCta = hero.primaryCta.label.trim() && hero.primaryCta.href.trim()
    ? hero.primaryCta
    : null;
  const secondaryCta = hero.secondaryCta.label.trim() && hero.secondaryCta.href.trim()
    ? hero.secondaryCta
    : null;

  return (
    <section className={styles.hero} data-main-chrome-tone="dark">
      <div className={styles.heroMedia}>
        {hero.imageUrl ? (
          <Image
            src={
              hero.imageUrl.startsWith("/")
                ? `${hero.imageUrl}?v=otr`
                : hero.imageUrl
            }
            alt={hero.imageAlt}
            fill
            priority
            sizes="100vw"
            style={{ objectPosition: `${(hero.imageFocalX ?? 0.5) * 100}% ${(hero.imageFocalY ?? 0.5) * 100}%` }}
          />
        ) : null}
      </div>

      <div className={styles.heroOverlay} aria-hidden="true" />

      <div className={styles.inner}>
        <div className={styles.heroCopy}>
          {hero.eyebrow ? <p className={styles.eyebrow}>{hero.eyebrow}</p> : null}
          <h1>{hero.title}</h1>
          <p>{hero.lead}</p>
          {primaryCta || secondaryCta ? (
            <div className={`${styles.heroActions} action-row`}>
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
          {hero.metricLabel || hero.metricText ? (
            <div className={styles.heroMetric}>
              {hero.metricLabel ? <strong>{hero.metricLabel}</strong> : null}
              {hero.metricText ? <span>{hero.metricText}</span> : null}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
