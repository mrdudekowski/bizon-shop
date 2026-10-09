import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

import styles from "./PageHero.module.css";

export type PageHeroBreadcrumb = {
  href: string;
  label: string;
};

export type PageHeroMedia = {
  src: string;
  alt: string;
};

type PageHeroProps = {
  kicker?: string;
  title: string;
  description?: string;
  breadcrumbs?: PageHeroBreadcrumb[];
  media?: PageHeroMedia;
  actions?: ReactNode;
};

export function PageHero({
  kicker,
  title,
  description,
  breadcrumbs = [],
  media,
  actions,
}: PageHeroProps) {
  return (
    <header className={styles.hero} data-main-chrome-tone="light">
      <div className={styles.inner}>
        <div className={styles.copy}>
          {breadcrumbs.length > 0 && (
            <nav aria-label="Breadcrumb" className={styles.breadcrumbs}>
              <ol>
                {breadcrumbs.map((item, index) => (
                  <li key={`${item.href}-${item.label}`}>
                    {index === breadcrumbs.length - 1 ? (
                      <span aria-current="page">{item.label}</span>
                    ) : (
                      <Link href={item.href}>{item.label}</Link>
                    )}
                    {index < breadcrumbs.length - 1 && (
                      <span aria-hidden="true">/</span>
                    )}
                  </li>
                ))}
              </ol>
            </nav>
          )}
          {kicker ? <p className={styles.kicker}>{kicker}</p> : null}
          <h1 data-title-long={title.length > 24 ? "true" : undefined}>{title}</h1>
          {description ? <p className={styles.description}>{description}</p> : null}
          {actions ? <div className={styles.actions}>{actions}</div> : null}
        </div>
        {media ? (
          <div className={styles.media}>
            <Image
              src={media.src}
              alt={media.alt}
              fill
              sizes="(max-width: 767px) 100vw, 42vw"
              priority={false}
            />
          </div>
        ) : null}
      </div>
    </header>
  );
}
