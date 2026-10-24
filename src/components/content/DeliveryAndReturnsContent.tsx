"use client";

import Image from "next/image";
import { PageHero } from "@/components/content/PageHero";
import type { PublishedStubOverlay } from "@/lib/content/getPageContent";
import { usePublishedStubOverlay } from "@/lib/content/usePublishedStubOverlay";

export function DeliveryAndReturnsContent({ page }: { page: PublishedStubOverlay }) {
  const live = usePublishedStubOverlay("shop-delivery-returns", page);
  const content = live ?? page;

  return (
    <div>
      <PageHero
        kicker={content.hero.eyebrow ?? ""}
        title={content.hero.title ?? ""}
        description={content.hero.lead ?? ""}
        breadcrumbs={[
          { href: "/shop", label: "BIZON Shop" },
          { href: "/shop/delivery-and-returns", label: "Доставка и возврат" },
        ]}
        media={content.hero.imageUrl ? { src: content.hero.imageUrl, alt: content.hero.imageAlt ?? "" } : undefined}
      />
      {content.notice?.body.trim() ? <div className="section-inner mt-8" role="note">{content.notice.body}</div> : null}
      {content.features?.some((feature) => feature.title.trim() || feature.text.trim()) ? (
        <section className="section-inner mt-8" aria-label={content.featuresHeading || "Информация"}>
          {content.featuresHeading ? <h2 id="delivery-features-heading" className="text-xl font-semibold">{content.featuresHeading}</h2> : null}
          <div className="mt-4 grid grid-cols-1 gap-5">
            {content.features.filter((feature) => feature.title.trim() || feature.text.trim()).map((feature) => <article className="card-base info-card" key={feature.id}>
              {feature.title.trim() ? <h3 className="info-card-title">{feature.title}</h3> : null}
              {feature.text.trim() ? <p className="info-card-text mt-3">{feature.text}</p> : null}
            </article>)}
          </div>
        </section>
      ) : null}
      {content.documents?.length ? (
        <section className="mt-8 max-w-3xl" aria-labelledby="delivery-documents-heading">
          <h2 id="delivery-documents-heading" className="text-xl font-semibold">Документы</h2>
          <ul className="mt-3 grid grid-cols-1 gap-3">
            {content.documents.map((document, index) => <li key={`${document.url}-${index}`} className="min-w-0 max-w-full">
              <a className="break-all underline" href={document.url}>{document.title || "Скачать документ"}</a>
            </li>)}
          </ul>
        </section>
      ) : null}
      {content.sections?.filter((section) => section.heading.trim() || section.body.trim()).map((section) => <section className="section-inner mt-8 max-w-3xl" key={section.id}>
        {section.heading ? <h2 className="text-xl font-semibold">{section.heading}</h2> : null}
        {section.body.split(/\r?\n\s*\r?\n/).filter(Boolean).map((paragraph, index) => <p className="mt-3" key={`${section.id}-${index}`}>{paragraph}</p>)}
      </section>)}
      {content.proof ? <section className={`section-inner mt-8 grid grid-cols-1 gap-6${content.proof.imageUrl ? " md:grid-cols-2" : ""}`} aria-labelledby="delivery-proof-heading">
        {content.proof.imageUrl ? <div className="relative min-h-72 overflow-hidden rounded-2xl">
          <Image src={content.proof.imageUrl} alt={content.proof.imageAlt ?? ""} fill sizes="(max-width: 767px) 100vw, 50vw" className="object-cover" />
        </div> : null}
        <div className="min-w-0">
          <h2 id="delivery-proof-heading" className="text-xl font-semibold">{content.proof.title}</h2>
          <p className="mt-3">{content.proof.text}</p>
        </div>
      </section> : null}
      {content.cta ? <section className="section-inner mt-8 flex flex-wrap gap-3" aria-label="Дальнейшие действия">
        <a className="btn-accent" href={content.cta.href}>{content.cta.label}</a>
        {content.cta.secondaryHref && content.cta.secondaryLabel ? <a className="btn-secondary" href={content.cta.secondaryHref}>{content.cta.secondaryLabel}</a> : null}
      </section> : null}
    </div>
  );
}
