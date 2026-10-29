"use client";

import Image from "next/image";
import { PageHero } from "@/components/content/PageHero";
import type { PublishedStubOverlay } from "@/lib/content/getPageContent";
import { usePublishedStubOverlay } from "@/lib/content/usePublishedStubOverlay";
import styles from "./DeliveryAndReturnsContent.module.css";

const PAGE_TITLE = "Оплата, доставка и возврат";

function paragraphs(body: string): string[] {
  return body.split(/\r?\n\s*\r?\n/).map((paragraph) => paragraph.trim()).filter(Boolean);
}

export function DeliveryAndReturnsContent({ page }: { page: PublishedStubOverlay }) {
  const live = usePublishedStubOverlay("shop-delivery-returns", page);
  const content = live ?? page;
  const title = content.hero.title?.trim() || PAGE_TITLE;
  const sections = content.sections?.filter((section) => section.heading.trim() || section.body.trim()) ?? [];
  const features = content.features?.filter((feature) => feature.title.trim() || feature.text.trim()) ?? [];

  return (
    <div className={styles.page} data-shop-chrome-tone="light" data-main-chrome-tone="light">
      <PageHero
        kicker={content.hero.eyebrow ?? ""}
        title={title}
        description={content.hero.lead ?? ""}
        breadcrumbs={[
          { href: "/shop", label: "BIZON Shop" },
          { href: "/shop/delivery-and-returns", label: title },
        ]}
        media={content.hero.imageUrl ? { src: content.hero.imageUrl, alt: content.hero.imageAlt ?? "" } : undefined}
      />
      <div className={styles.stack}>
        {content.notice?.body.trim() ? (
          <p className={styles.notice} role="note">{content.notice.body}</p>
        ) : null}
        {features.length > 0 ? (
          <section className={styles.block} aria-label={content.featuresHeading || "Информация"}>
            {content.featuresHeading ? <h2>{content.featuresHeading}</h2> : null}
            <div className={styles.features}>
              {features.map((feature) => (
                <article className="card-base info-card" key={feature.id}>
                  {feature.title.trim() ? <h3 className="info-card-title">{feature.title}</h3> : null}
                  {feature.text.trim() ? <p className="info-card-text">{feature.text}</p> : null}
                </article>
              ))}
            </div>
          </section>
        ) : null}
        {content.documents?.length ? (
          <section className={`${styles.block} ${styles.documents}`} aria-labelledby="delivery-documents-heading">
            <h2 id="delivery-documents-heading">Документы</h2>
            <ul>
              {content.documents.map((document, index) => (
                <li key={`${document.url}-${index}`}>
                  <a href={document.url}>{document.title || "Скачать документ"}</a>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
        {sections.map((section) => (
          <section className={styles.block} key={section.id}>
            {section.heading ? <h2>{section.heading}</h2> : null}
            <div className={styles.paragraphs}>
              {paragraphs(section.body).map((paragraph, index) => (
                <p key={`${section.id}-${index}`}>{paragraph}</p>
              ))}
            </div>
          </section>
        ))}
        {content.proof ? (
          <section className={styles.proof} aria-labelledby="delivery-proof-heading">
            {content.proof.imageUrl ? (
              <div className={styles.proofMedia}>
                <Image src={content.proof.imageUrl} alt={content.proof.imageAlt ?? ""} fill sizes="(max-width: 767px) 100vw, 50vw" className="object-cover" />
              </div>
            ) : null}
            <div className={styles.block}>
              <h2 id="delivery-proof-heading">{content.proof.title}</h2>
              <p>{content.proof.text}</p>
            </div>
          </section>
        ) : null}
        {content.cta ? (
          <div className={styles.actions}>
            <a className="btn-accent" href={content.cta.href}>{content.cta.label}</a>
            {content.cta.secondaryHref && content.cta.secondaryLabel ? (
              <a className="btn-secondary" href={content.cta.secondaryHref}>{content.cta.secondaryLabel}</a>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
