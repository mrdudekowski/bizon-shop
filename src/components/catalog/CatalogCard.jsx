import Link from "next/link";

import { CatalogImage } from "@/components/catalog/CatalogImage";
import { SiteArrow } from "@/components/SiteArrow/SiteArrow";

export function CatalogCard({
  href,
  title,
  description,
  meta = null,
  imageUrl = null,
  imageAlt,
  mediaKey = undefined,
}) {
  const alt = imageAlt ?? title;

  return (
    <article className="card-base info-card catalog-card">
      <div className="catalog-card__media">
        <CatalogImage
          src={imageUrl}
          alt={alt}
          fallbackKey={mediaKey}
          fill
          sizes="(max-width: 768px) 100vw, 33vw"
        />
      </div>
      <div className="catalog-card__body">
        {meta && <p className="text-sm text-muted mb-2">{meta}</p>}
        <h2 className="info-card-title">
          <Link href={href} className="catalog-card__link">
            {title}
          </Link>
        </h2>
        {description && <p className="info-card-text">{description}</p>}
        <span className="catalog-card__arrow" aria-hidden="true"><SiteArrow /></span>
      </div>
    </article>
  );
}
