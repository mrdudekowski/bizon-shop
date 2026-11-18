import Link from "next/link";
import type { ReactNode } from "react";

import { CatalogImage } from "@/components/catalog/CatalogImage";
import { PageHero, type PageHeroBreadcrumb } from "@/components/content/PageHero";
import { SiteArrow } from "@/components/SiteArrow/SiteArrow";
import { responsiveFocalStyle } from "@/lib/content/responsiveFocalPosition";
import type { ResponsiveFocalMap } from "@/lib/content/types";

import styles from "./ArticleLayout.module.css";

type ArticleLayoutProps = {
  kicker?: string;
  title: string;
  description?: string;
  breadcrumbs: PageHeroBreadcrumb[];
  meta?: string | null;
  aside?: ReactNode;
  imageUrl?: string | null;
  imageAlt: string;
  imageFocalX?: number;
  imageFocalY?: number;
  imageFocalByViewport?: ResponsiveFocalMap;
  fallbackKey: string;
  backHref: string;
  backLabel: string;
  children: ReactNode;
};

export function ArticleLayout({
  kicker,
  title,
  description,
  breadcrumbs,
  meta,
  aside,
  imageUrl,
  imageAlt,
  imageFocalX,
  imageFocalY,
  imageFocalByViewport,
  fallbackKey,
  backHref,
  backLabel,
  children,
}: ArticleLayoutProps) {
  return (
    <div data-main-chrome-tone="light">
      <PageHero
        kicker={kicker}
        title={title}
        description={description}
        breadcrumbs={breadcrumbs}
      />
      <div className={styles.body}>
        <div className={styles.lead}>
          {imageUrl ? (
            <div className={styles.leadMedia}>
              <CatalogImage
                src={imageUrl}
                fallbackKey={fallbackKey}
                alt={imageAlt}
                fill
                sizes="(max-width: 767px) 100vw, 70vw"
                className="responsiveFocalImage"
                style={responsiveFocalStyle(imageFocalByViewport, imageFocalX, imageFocalY)}
              />
            </div>
          ) : null}
          <div className={styles.leadMeta}>
            {meta ? <p className={styles.meta}>{meta}</p> : null}
            {aside}
          </div>
        </div>
        <article className={styles.article}>{children}</article>
        <section className={styles.nextStep} aria-labelledby="article-next-step-heading">
          <p className={styles.meta}>Следующий шаг</p>
          <h2 id="article-next-step-heading">Переведите знания в задачу</h2>
          <p>Каталог помогает изучить доступные направления, а специалист проверит решение по вашей технике и условиям эксплуатации.</p>
          <div className={`${styles.actions} action-row`}>
            <Link href="/contact?subject=tire-selection" className={`btn-accent ${styles.primaryAction}`}>Передать задачу специалисту</Link>
            <Link href="/models" className={styles.secondaryAction}>Посмотреть каталог</Link>
          </div>
        </section>
        <p className={styles.back}>
          <Link href={backHref} className="btn-secondary">
            <SiteArrow direction="left" /> {backLabel}
          </Link>
        </p>
      </div>
    </div>
  );
}
