import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

import { PageHero, type PageHeroBreadcrumb, type PageHeroMedia } from "@/components/content/PageHero";

import styles from "./ServicePage.module.css";

export type ServiceFeature = {
  title: string;
  text: string;
  index?: string;
};

export type ServiceCta = {
  href: string;
  label: string;
  secondaryHref?: string;
  secondaryLabel?: string;
};

type ServicePageProps = {
  kicker?: string;
  title: string;
  description: string;
  breadcrumbs: PageHeroBreadcrumb[];
  media?: PageHeroMedia;
  notice?: ReactNode;
  featuresHeading?: string;
  features: ServiceFeature[];
  proof?: {
    src: string;
    alt: string;
    title: string;
    text: string;
  };
  cta?: ServiceCta;
  children?: ReactNode;
};

export function ServicePage({
  kicker,
  title,
  description,
  breadcrumbs,
  media,
  notice,
  featuresHeading,
  features,
  proof,
  cta,
  children,
}: ServicePageProps) {
  return (
    <div data-main-chrome-tone="light">
      <PageHero
        kicker={kicker}
        title={title}
        description={description}
        breadcrumbs={breadcrumbs}
        media={media}
      />
      <div className={styles.body}>
        {notice ? <div className={styles.notice}>{notice}</div> : null}

        <section className={styles.features} aria-labelledby="service-features-heading">
          {featuresHeading ? (
            <h2 id="service-features-heading">{featuresHeading}</h2>
          ) : (
            <h2 id="service-features-heading" className={styles.visuallyHidden}>
              Ключевые пункты
            </h2>
          )}
          <ol className={styles.featureList}>
            {features.map((feature, index) => (
              <li key={feature.title}>
                <span className={styles.featureIndex}>
                  {feature.index ?? String(index + 1).padStart(2, "0")}
                </span>
                <div>
                  <h3>{feature.title}</h3>
                  <p>{feature.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        {proof ? (
          <section className={styles.proof} aria-labelledby="service-proof-heading" data-evidence-source="service-proof">
            <div className={styles.proofMedia}>
              <Image src={proof.src} alt={proof.alt} fill sizes="(max-width: 767px) 100vw, 48vw" />
            </div>
            <div className={styles.proofCopy}>
              <h2 id="service-proof-heading">{proof.title}</h2>
              <p>{proof.text}</p>
            </div>
          </section>
        ) : null}

        {children}

        {cta ? (
          <section className={styles.cta} aria-labelledby="service-cta-heading">
            <h2 id="service-cta-heading">Следующий шаг</h2>
            <div className={styles.ctaActions}>
              <Link className="btn-accent" href={cta.href}>
                {cta.label}
              </Link>
              {cta.secondaryHref && cta.secondaryLabel ? (
                <Link className="btn-secondary" href={cta.secondaryHref}>
                  {cta.secondaryLabel}
                </Link>
              ) : null}
            </div>
          </section>
        ) : null}
      </div>
    </div>
  );
}
