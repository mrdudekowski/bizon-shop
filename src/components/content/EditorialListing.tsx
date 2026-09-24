import Link from "next/link";
import type { ReactNode } from "react";

import { CatalogImage } from "@/components/catalog/CatalogImage";
import { PageHero, type PageHeroBreadcrumb } from "@/components/content/PageHero";
import { getTireIqTaxonomyLabel } from "@/lib/content/tireIqTaxonomy";

import styles from "./EditorialListing.module.css";

export type EditorialListingItem = {
  key: string;
  href: string;
  title: string;
  description?: string;
  meta?: string | null;
  imageUrl?: string | null;
  imageAlt?: string;
  fallbackKey?: string;
  taxonomy?: string[];
};

type EditorialListingProps = {
  kicker?: string;
  title: string;
  description?: string;
  breadcrumbs: PageHeroBreadcrumb[];
  items: EditorialListingItem[];
  emptyMessage?: string;
  beforeContent?: ReactNode;
  activeTopic?: string;
};

export function EditorialListing({
  kicker,
  title,
  description,
  breadcrumbs,
  items,
  emptyMessage = "Опубликованных материалов пока нет.",
  beforeContent,
  activeTopic,
}: EditorialListingProps) {
  const taxonomy = Array.from(new Set(items.flatMap((item) => item.taxonomy ?? [])));

  return (
    <div data-main-chrome-tone="light">
      <PageHero
        kicker={kicker}
        title={title}
        description={description}
        breadcrumbs={breadcrumbs}
      />
      <div className={styles.body}>
        {beforeContent}
        {taxonomy.length > 0 ? (
          <nav className={styles.taxonomy} aria-label="Темы Tire IQ">
            <span className={styles.taxonomyLabel}>Темы</span>
            <Link
              className={!activeTopic ? styles.taxonomyLinkActive : styles.taxonomyLink}
              href="/tire-iq#knowledge"
              aria-current={!activeTopic ? "page" : undefined}
            >
              Все темы
            </Link>
            {taxonomy.map((topic) => (
              <Link
                key={topic}
                className={topic === activeTopic ? styles.taxonomyLinkActive : styles.taxonomyLink}
                href={`/tire-iq?topic=${encodeURIComponent(topic)}#knowledge`}
                aria-current={topic === activeTopic ? "page" : undefined}
              >
                {getTireIqTaxonomyLabel(topic)}
              </Link>
            ))}
          </nav>
        ) : null}
        <section id="knowledge" aria-labelledby="knowledge-heading">
          <h2 id="knowledge-heading" className={styles.sectionTitle}>
            База знаний
          </h2>
        {items.length > 0 ? (
          <div className={styles.grid}>
            {items.map((item, index) => (
              <article
                key={item.key}
                className={index === 0 ? styles.featured : styles.card}
                data-editorial-card
              >
                <Link href={item.href} className={styles.media}>
                  <CatalogImage
                    src={item.imageUrl}
                    fallbackKey={item.fallbackKey ?? item.key}
                    alt={item.imageAlt ?? item.title}
                    fill
                    sizes={
                      index === 0
                        ? "(max-width: 767px) 100vw, 66vw"
                        : "(max-width: 767px) 100vw, 33vw"
                    }
                  />
                </Link>
                <div className={styles.copy}>
                  {item.meta ? <p className={styles.meta}>{item.meta}</p> : null}
                  <h2>
                    <Link href={item.href}>{item.title}</Link>
                  </h2>
                  {item.description ? <p>{item.description}</p> : null}
                  <Link href={item.href} className={styles.readMore}>
                    Читать <span aria-hidden="true">↗</span>
                  </Link>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className={styles.empty}>
            <p className={styles.meta}>База знаний готовится</p>
            <h2>{emptyMessage}</h2>
            <p>Пока опубликованных материалов нет. Передайте задачу специалисту, чтобы получить следующий практический шаг.</p>
            <Link className="btn-accent" href="/contact">
              Передать задачу специалисту
            </Link>
          </div>
        )}
        </section>
      </div>
    </div>
  );
}
