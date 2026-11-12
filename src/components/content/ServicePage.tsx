"use client";

import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { usePublishedStubOverlay } from "@/lib/content/usePublishedStubOverlay";
import type { PublishedStubOverlay } from "@/lib/content/getPageContent";
import { resolveServicePageCta, resolveServicePageProof } from "./servicePageEditorial";

import { PageHero, type PageHeroBreadcrumb, type PageHeroMedia } from "@/components/content/PageHero";
import { createBreadcrumbStructuredData, jsonLdScriptContent } from "@/lib/seo/structuredData";
import { TermsLinks } from "@/components/content/TermsLinks";
import { termsContextOfPage, termsParagraph } from "@/lib/content/termsPages";
import { ConfiguredForm, type ConfiguredSourceForm, type PageForm } from "@/components/forms/ConfiguredForm";
import { ContactRequest } from "@/components/forms/ContactRequest";
import { ROUTES } from "@/constants/navigation";

import styles from "./ServicePage.module.css";

export const FORM_SOURCE_BY_PAGE: Record<string, ConfiguredSourceForm | undefined> = {
  "become-a-supplier": "supplier",
  "shop-become-a-supplier": "shop_supplier",
  delivery: "delivery_quote",
  "delivery-geography": "delivery_quote",
  "shop-delivery": "shop_delivery",
  branding: "branding",
  warranty: "warranty",
  "shop-warranty": "shop_warranty",
};

const REQUEST_FORM_PAGE_KEYS = new Set(["contact", ...Object.keys(FORM_SOURCE_BY_PAGE)]);

const BANNER_MEDIA_PAGE_KEYS = new Set([
  "branding",
  "become-a-supplier",
  "shop-become-a-supplier",
  "delivery",
  "shop-delivery",
  "payment",
  "shop-payment",
  "warranty",
  "shop-warranty",
]);

const LOCKED_CTA_HREF_BY_PAGE: Record<string, string> = {
  payment: ROUTES.cart,
  "shop-payment": ROUTES.shopCart,
};

const DEFAULT_PAYMENT_CTA_LABEL = "Перейти к заявке";

const OMITTED_FEATURE_HEADINGS = new Set([
  "Как проходит первичное обращение",
  "Три шага для первичной проверки",
  "Как мы работаем",
  "Кратко о обработке данных",
]);

export type ServiceFeature = {
  title: string;
  text: string;
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
    hero?: PublishedStubOverlay["hero"];
    featuresHeading?: string;
    features?: { id: string; title: string; text: string }[];
    sections?: { id: string; heading: string; body: string }[];
    notice?: { body: string } | null;
    proof?: { imageUrl?: string | null; imageAlt?: string; imageFocalX?: number; imageFocalY?: number; title: string; text: string } | null;
    cta?: { label: string; href: string; secondaryLabel?: string; secondaryHref?: string } | null;
    form?: PageForm;
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
  const resolvedFeatures = (activeEditorial?.features ?? features).filter((feature) => feature.title.trim() || feature.text.trim());
  const featureHeading = OMITTED_FEATURE_HEADINGS.has((resolvedFeaturesHeading ?? "").trim()) ? "" : resolvedFeaturesHeading;
  const pageHasRequestForm = REQUEST_FORM_PAGE_KEYS.has(runtimePageKey ?? "");
  const formSource = FORM_SOURCE_BY_PAGE[runtimePageKey ?? ""];
  const liveForm = formSource && activeEditorial?.form ? activeEditorial.form : null;
  const resolvedProof = resolveServicePageProof(activeEditorial, proof);
  const lockedCtaHref = LOCKED_CTA_HREF_BY_PAGE[runtimePageKey ?? ""];
  const resolvedCta: ServiceCta | undefined = lockedCtaHref
    ? { href: lockedCtaHref, label: activeEditorial?.cta?.label?.trim() || DEFAULT_PAYMENT_CTA_LABEL }
    : resolveServicePageCta(activeEditorial, cta);
  const termsContext = termsContextOfPage(runtimePageKey);
  return (
    <div data-main-chrome-tone="light">
      {breadcrumbs.length > 0 ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLdScriptContent(createBreadcrumbStructuredData(breadcrumbs)) }}
        />
      ) : null}
      <PageHero
        kicker={activeKicker}
        title={activeTitle}
        description={activeDescription}
        breadcrumbs={breadcrumbs}
        media={activeMedia}
        mediaLayout={BANNER_MEDIA_PAGE_KEYS.has(runtimePageKey ?? "") ? "banner" : "aside"}
      />
      <div className={styles.body}>
        {resolvedNotice ? <div className={styles.notice}>{resolvedNotice}</div> : null}

        {resolvedFeatures.length > 0 ? <section className={styles.features} aria-labelledby="service-features-heading">
          {featureHeading ? (
            <h2 id="service-features-heading">{featureHeading}</h2>
          ) : (
            <h2 id="service-features-heading" className={styles.visuallyHidden}>
              Ключевые пункты
            </h2>
          )}
          <ol className={styles.featureList}>
            {resolvedFeatures.map((feature, index) => (
              <li key={(feature as { id?: string }).id ?? feature.title}>
                <span className={`${styles.featureIndex} ${runtimePageKey === "branding" ? styles.featureIndexBranding : ""}`}>
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div>
                  {feature.title.trim() ? <h3>{feature.title}</h3> : null}
                  {feature.text.trim() ? <p>{feature.text}</p> : null}
                </div>
              </li>
            ))}
          </ol>
        </section> : null}

        {resolvedProof ? (
          <section className={styles.proof} aria-labelledby={resolvedProof.title.trim() ? "service-proof-heading" : undefined} data-evidence-source="service-proof">
            {resolvedProof.src ? <div className={styles.proofMedia}>
              <Image src={resolvedProof.src} alt={resolvedProof.alt} fill sizes="(max-width: 767px) 100vw, 48vw" style={{ objectPosition: `${(resolvedProof.focalX ?? 0.5) * 100}% ${(resolvedProof.focalY ?? 0.5) * 100}%` }} />
            </div> : null}
            <div className={styles.proofCopy}>
              {resolvedProof.title.trim() ? <h2 id="service-proof-heading">{resolvedProof.title}</h2> : null}
              {resolvedProof.text.trim() ? <p>{resolvedProof.text}</p> : null}
            </div>
          </section>
        ) : null}

        {activeEditorial?.sections !== undefined ? (
          <>
            {activeEditorial.sections.map((section) => {
              const paragraphs = section.body.split(/\r?\n\s*\r?\n/).map((paragraph) => paragraph.trim()).filter(Boolean);
              if (!section.heading.trim() && paragraphs.length === 0) return null;
              return (
                <section key={section.id} className={styles.editorialSection}>
                  {section.heading.trim() ? <h2>{section.heading}</h2> : null}
                  {paragraphs.map((paragraph, index) => (
                    <p key={`${section.id}-${index}`}>{paragraph}</p>
                  ))}
                </section>
              );
            })}
            {renderChildrenWithEditorial ? children : null}
          </>
        ) : children}

        {liveForm && formSource ? (
          <ContactRequest>
            <ConfiguredForm form={liveForm} sourceForm={formSource} />
          </ContactRequest>
        ) : null}

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

        {resolvedCta && !pageHasRequestForm ? (
          <section className={styles.cta} aria-labelledby="service-cta-heading">
            <h2 id="service-cta-heading">Следующий шаг</h2>
            <div className={`${styles.ctaActions} action-row`}>
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

        {termsContext && termsParagraph(termsContext.current) ? (
          <section className={styles.editorialSection}>
            <p>{termsParagraph(termsContext.current)}</p>
          </section>
        ) : null}
        {termsContext ? <TermsLinks surface={termsContext.surface} current={termsContext.current} /> : null}
      </div>
    </div>
  );
}
