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
  documents?: { url: string; title: string }[];
  proof?: {
    src?: string;
    alt: string;
    title: string;
    text: string;
  };
  cta?: ServiceCta;
  children?: ReactNode;
  editorial?: {
    featuresHeading?: string;
    features?: { id: string; title: string; text: string }[];
    sections?: { id: string; heading: string; body: string }[];
    notice?: { body: string } | null;
    proof?: { imageUrl?: string | null; imageAlt?: string; title: string; text: string } | null;
    cta?: { label: string; href: string; secondaryLabel?: string; secondaryHref?: string } | null;
  };
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
  documents = [],
  proof,
  cta,
  children,
  editorial,
}: ServicePageProps) {
  const resolvedNotice = editorial?.notice !== undefined ? editorial.notice?.body : notice;
  const resolvedFeaturesHeading = editorial?.featuresHeading ?? featuresHeading;
  const resolvedFeatures = editorial?.features ?? features;
  const resolvedProof = editorial?.proof !== undefined
    ? editorial.proof
      ? { ...(editorial.proof.imageUrl ? { src: editorial.proof.imageUrl } : {}), alt: editorial.proof.imageAlt ?? "", title: editorial.proof.title, text: editorial.proof.text }
      : undefined
    : proof;
  const resolvedCta = editorial?.cta !== undefined
    ? editorial.cta
      ? { href: editorial.cta.href, label: editorial.cta.label, secondaryHref: editorial.cta.secondaryHref, secondaryLabel: editorial.cta.secondaryLabel }
      : undefined
    : cta;
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
        {resolvedNotice ? <div className={styles.notice}>{resolvedNotice}</div> : null}

        {resolvedFeatures.length > 0 || resolvedFeaturesHeading ? <section className={styles.features} aria-labelledby="service-features-heading">
          {resolvedFeaturesHeading ? (
            <h2 id="service-features-heading">{resolvedFeaturesHeading}</h2>
          ) : (
            <h2 id="service-features-heading" className={styles.visuallyHidden}>
              Ключевые пункты
            </h2>
          )}
          <ol className={styles.featureList}>
            {resolvedFeatures.map((feature, index) => (
              <li key={(feature as { id?: string }).id ?? feature.title}>
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
        </section> : null}

        {resolvedProof ? (
          <section className={styles.proof} aria-labelledby="service-proof-heading" data-evidence-source="service-proof">
            {resolvedProof.src ? <div className={styles.proofMedia}>
              <Image src={resolvedProof.src} alt={resolvedProof.alt} fill sizes="(max-width: 767px) 100vw, 48vw" />
            </div> : null}
            <div className={styles.proofCopy}>
              <h2 id="service-proof-heading">{resolvedProof.title}</h2>
              <p>{resolvedProof.text}</p>
            </div>
          </section>
        ) : null}

        {editorial?.sections !== undefined
          ? editorial.sections.map((section) => (
              <section key={section.id} className={styles.editorialSection}>
                <h2>{section.heading}</h2>
                {section.body.split(/\r?\n\s*\r?\n/).filter(Boolean).map((paragraph, index) => (
                  <p key={`${section.id}-${index}`}>{paragraph}</p>
                ))}
              </section>
            ))
          : children}

        {documents.length > 0 ? (
          <section className={styles.documents} aria-labelledby="service-documents-heading">
            <h2 id="service-documents-heading">Документы</h2>
            <ul>
              {documents.map((document, index) => (
                <li key={`${document.url}-${index}`}>
                  <a href={document.url}>{document.title || "Скачать документ"}</a>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {resolvedCta ? (
          <section className={styles.cta} aria-labelledby="service-cta-heading">
            <h2 id="service-cta-heading">Следующий шаг</h2>
            <div className={styles.ctaActions}>
              <Link className="btn-accent" href={resolvedCta.href}>
                {resolvedCta.label}
              </Link>
              {resolvedCta.secondaryHref && resolvedCta.secondaryLabel ? (
                <Link className="btn-secondary" href={resolvedCta.secondaryHref}>
                  {resolvedCta.secondaryLabel}
                </Link>
              ) : null}
            </div>
          </section>
        ) : null}
      </div>
    </div>
  );
}
