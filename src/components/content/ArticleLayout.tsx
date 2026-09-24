import Link from "next/link";
import type { ReactNode } from "react";

import { CatalogImage } from "@/components/catalog/CatalogImage";
import { PageHero, type PageHeroBreadcrumb } from "@/components/content/PageHero";

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
          <div className={styles.leadMedia}>
            <CatalogImage
              src={imageUrl}
              fallbackKey={fallbackKey}
              alt={imageAlt}
              fill
              sizes="(max-width: 767px) 100vw, 70vw"
            />
          </div>
          <div className={styles.leadMeta}>
            {meta ? <p className={styles.meta}>{meta}</p> : null}
            {aside}
          </div>
        </div>
        <article className={styles.article}>{children}</article>
        <section className={styles.modelContext} aria-labelledby="article-model-context-heading">
          <p className={styles.meta}>Текущий контур BIZON</p>
          <h2 id="article-model-context-heading">Модели для дальнейшей проверки</h2>
          <p>Эти три опубликованные TBR-модели доступны для просмотра. Совместимость проверяется по размеру, оси, нагрузке и условиям эксплуатации.</p>
          <div className={styles.modelLinks}>
            <Link href="/models/tbr/dsr158" className="btn-secondary">DSR158</Link>
            <Link href="/models/tbr/dsr177" className="btn-secondary">DSR177</Link>
            <Link href="/models/tbr/dsr188" className="btn-secondary">DSR188</Link>
          </div>
        </section>
        <section className={styles.nextStep} aria-labelledby="article-next-step-heading">
          <p className={styles.meta}>Следующий шаг</p>
          <h2 id="article-next-step-heading">Переведите знания в задачу</h2>
          <p>Каталог помогает изучить доступные направления, а специалист проверит решение по вашей технике и условиям эксплуатации.</p>
          <div className={styles.actions}>
            <Link href="/models" className="btn-secondary">Посмотреть каталог</Link>
            <Link href="/selection" className="btn-secondary">Начать подбор</Link>
            <Link href="/contact?subject=tire-selection" className="btn-accent">Передать задачу специалисту</Link>
          </div>
        </section>
        <p className={styles.back}>
          <Link href={backHref} className="btn-secondary">
            ← {backLabel}
          </Link>
        </p>
      </div>
    </div>
  );
}
