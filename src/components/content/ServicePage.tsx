"use client";

import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { usePublishedStubOverlay } from "@/lib/content/usePublishedStubOverlay";
import type { PublishedStubOverlay } from "@/lib/content/getPageContent";
import { resolveServicePageCta, resolveServicePageProof } from "./servicePageEditorial";

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
    focalX?: number;
    focalY?: number;
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
    proof?: { imageUrl?: string | null; imageAlt?: string; imageFocalX?: number; imageFocalY?: number; title: string; text: string } | null;
    cta?: { label: string; href: string; secondaryLabel?: string; secondaryHref?: string } | null;
  };
  runtimePageKey?: string;
  renderChildrenWithEditorial?: boolean;
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
  runtimePageKey,
  renderChildrenWithEditorial = false,
}: ServicePageProps) {
  const livePage = usePublishedStubOverlay(runtimePageKey ?? "", runtimePageKey ? editorial as PublishedStubOverlay : null);
  const activeEditorial = runtimePageKey ? livePage : editorial;
  const activeTitle = runtimePageKey ? livePage?.hero.title ?? title : title;
  const activeDescription = runtimePageKey ? livePage?.hero.lead ?? description : description;
  const activeKicker = runtimePageKey ? livePage?.hero.eyebrow ?? kicker : kicker;
  const activeMedia = runtimePageKey && livePage?.hero.imageUrl
    ? { src: livePage.hero.imageUrl, alt: livePage.hero.imageAlt ?? "", focalX: livePage.hero.imageFocalX, focalY: livePage.hero.imageFocalY }
    : runtimePageKey ? undefined : media;
  const activeDocuments = runtimePageKey ? livePage?.documents ?? [] : documents;
  const resolvedNotice = activeEditorial?.notice !== undefined ? activeEditorial.notice?.body : notice;
  const resolvedFeaturesHeading = activeEditorial?.featuresHeading ?? featuresHeading;
  const resolvedFeatures = activeEditorial?.features ?? features;
  const resolvedProof = resolveServicePageProof(activeEditorial, proof);
  const resolvedCta = resolveServicePageCta(activeEditorial, cta);
  return (
    <div data-main-chrome-tone="light">
      <PageHero
        kicker={activeKicker}
        title={activeTitle}
        description={activeDescription}
        breadcrumbs={breadcrumbs}
        media={activeMedia}
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
              <Image src={resolvedProof.src} alt={resolvedProof.alt} fill sizes="(max-width: 767px) 100vw, 48vw" style={{ objectPosition: `${(resolvedProof.focalX ?? 0.5) * 100}% ${(resolvedProof.focalY ?? 0.5) * 100}%` }} />
            </div> : null}
            <div className={styles.proofCopy}>
              <h2 id="service-proof-heading">{resolvedProof.title}</h2>
              <p>{resolvedProof.text}</p>
            </div>
          </section>
        ) : null}

        {activeEditorial?.sections !== undefined ? (
          <>
            {activeEditorial.sections.map((section) => (
              <section key={section.id} className={styles.editorialSection}>
                <h2>{section.heading}</h2>
                {section.body.split(/\r?\n\s*\r?\n/).filter(Boolean).map((paragraph, index) => (
                  <p key={`${section.id}-${index}`}>{paragraph}</p>
                ))}
              </section>
            ))}
            {renderChildrenWithEditorial ? children : null}
          </>
        ) : children}

        {activeDocuments.length > 0 ? (
          <section className={styles.documents} aria-labelledby="service-documents-heading">
            <h2 id="service-documents-heading">Документы</h2>
            <ul>
              {activeDocuments.map((document, index) => (
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
