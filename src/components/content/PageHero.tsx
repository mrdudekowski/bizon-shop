import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

import styles from "./PageHero.module.css";
import { responsiveFocalStyle } from "@/lib/content/responsiveFocalPosition";
import type { ResponsiveFocalMap } from "@/lib/content/types";

export type PageHeroBreadcrumb = {
  href: string;
  label: string;
};

export type PageHeroMedia = {
  src: string;
  alt: string;
  focalX?: number;
  focalY?: number;
  focalByViewport?: ResponsiveFocalMap;
};

type PageHeroProps = {
  kicker?: string;
  title: string;
  description?: string;
  breadcrumbs?: PageHeroBreadcrumb[];
  media?: PageHeroMedia;
  /** Full-viewport-width image header. Side column stays the default. */
  mediaLayout?: "aside" | "banner";
  actions?: ReactNode;
};

export function PageHero({
  kicker,
  title,
  description,
  breadcrumbs = [],
  media,
  mediaLayout = "aside",
  actions,
}: PageHeroProps) {
  const banner = mediaLayout === "banner" && media;
  const image = media ? (
    <Image
      src={media.src}
      alt={media.alt}
      fill
      sizes={banner ? "100vw" : "(max-width: 767px) 100vw, 42vw"}
      priority={Boolean(banner)}
      className="responsiveFocalImage"
      style={responsiveFocalStyle(media.focalByViewport, media.focalX, media.focalY)}
    />
  ) : null;

  return (
    <header
      className={styles.hero}
      data-layout={banner ? "banner" : undefined}
      data-main-chrome-tone="light"
      data-shop-chrome-tone="light"
    >
      {banner ? <div className={styles.banner}>{image}</div> : null}
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
          {title.trim() ? <h1>{title}</h1> : null}
          {description ? <p className={styles.description}>{description}</p> : null}
          {actions ? <div className={`${styles.actions} action-row`}>{actions}</div> : null}
        </div>
        {!banner && media ? <div className={styles.media}>{image}</div> : null}
      </div>
    </header>
  );
}
