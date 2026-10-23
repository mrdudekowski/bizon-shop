import Image from "next/image";
import { getPublishedStubOverlay } from "@/lib/content/getPageContent";
import { createPageMetadata } from "@/lib/seo/metadata";
import { PageHero } from "@/components/content/PageHero";

export async function generateMetadata() {
  const page = await getPublishedStubOverlay("shop-delivery-returns");
  return createPageMetadata({
    title: page?.seoTitle ?? "",
    description: page?.seoDescription ?? "",
    path: "/shop/delivery-and-returns",
  });
}

export default async function DeliveryAndReturnsPage() {
  const page = await getPublishedStubOverlay("shop-delivery-returns");
  return (
    <div>
      <PageHero
        kicker={page?.hero.eyebrow ?? ""}
        title={page?.hero.title ?? ""}
        description={page?.hero.lead ?? ""}
        breadcrumbs={[
          { href: "/shop", label: "BIZON Shop" },
          { href: "/shop/delivery-and-returns", label: "Доставка и возврат" },
        ]}
        media={page?.hero.imageUrl ? { src: page.hero.imageUrl, alt: page.hero.imageAlt ?? "" } : undefined}
      />
      {page?.notice?.body.trim() ? <div className="section-inner mt-8" role="note">{page.notice.body}</div> : null}
      {page?.features?.some((feature) => feature.title.trim() || feature.text.trim()) ? (
        <section className="section-inner mt-8" aria-label={page.featuresHeading || "Информация"}>
          {page.featuresHeading ? <h2 id="delivery-features-heading" className="text-xl font-semibold">{page.featuresHeading}</h2> : null}
          <div className="mt-4 grid grid-cols-1 gap-5">
            {page.features.filter((feature) => feature.title.trim() || feature.text.trim()).map((feature) => <article className="card-base info-card" key={feature.id}>
              {feature.title.trim() ? <h3 className="info-card-title">{feature.title}</h3> : null}
              {feature.text.trim() ? <p className="info-card-text mt-3">{feature.text}</p> : null}
            </article>)}
          </div>
        </section>
      ) : null}
      {page?.documents?.length ? (
        <section className="mt-8 max-w-3xl" aria-labelledby="delivery-documents-heading">
          <h2 id="delivery-documents-heading" className="text-xl font-semibold">Документы</h2>
          <ul className="mt-3 grid grid-cols-1 gap-3">
            {page.documents.map((document, index) => (
              <li key={`${document.url}-${index}`} className="min-w-0 max-w-full">
                <a className="break-all underline" href={document.url}>{document.title || "Скачать документ"}</a>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      {page?.sections?.filter((section) => section.heading.trim() || section.body.trim()).map((section) => <section className="section-inner mt-8 max-w-3xl" key={section.id}>
        {section.heading ? <h2 className="text-xl font-semibold">{section.heading}</h2> : null}
        {section.body.split(/\r?\n\s*\r?\n/).filter(Boolean).map((paragraph, index) => <p className="mt-3" key={`${section.id}-${index}`}>{paragraph}</p>)}
      </section>)}
      {page?.proof !== undefined && page.proof ? <section className={`section-inner mt-8 grid grid-cols-1 gap-6${page.proof.imageUrl ? " md:grid-cols-2" : ""}`} aria-labelledby="delivery-proof-heading">
        {page.proof.imageUrl ? <div className="relative min-h-72 overflow-hidden rounded-2xl">
          <Image src={page.proof.imageUrl} alt={page.proof.imageAlt ?? ""} fill sizes="(max-width: 767px) 100vw, 50vw" className="object-cover" />
        </div> : null}
        <div className="min-w-0">
          <h2 id="delivery-proof-heading" className="text-xl font-semibold">{page.proof.title}</h2>
          <p className="mt-3">{page.proof.text}</p>
        </div>
      </section> : null}
      {page?.cta !== undefined && page.cta ? <section className="section-inner mt-8 flex flex-wrap gap-3" aria-label="Дальнейшие действия">
        <a className="btn-accent" href={page.cta.href}>{page.cta.label}</a>
        {page.cta.secondaryHref && page.cta.secondaryLabel ? <a className="btn-secondary" href={page.cta.secondaryHref}>{page.cta.secondaryLabel}</a> : null}
      </section> : null}
    </div>
  );
}
