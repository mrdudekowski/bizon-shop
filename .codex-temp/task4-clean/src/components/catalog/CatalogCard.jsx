import Link from "next/link";

import { CatalogImage } from "@/components/catalog/CatalogImage";

export function CatalogCard({
  href,
  title,
  description,
  meta = null,
  imageUrl = null,
  imageAlt,
}) {
  const alt = imageAlt ?? title;

  return (
    <article className="card-base info-card catalog-card">
      <div className="catalog-card__media">
        <CatalogImage src={imageUrl} alt={alt} fill sizes="(max-width: 768px) 100vw, 33vw" />
      </div>
      <div className="catalog-card__body">
        <h2 className="info-card-title">
          <Link href={href}>{title}</Link>
        </h2>
        {meta && <p className="text-sm text-muted mb-2">{meta}</p>}
        {description && <p className="info-card-text">{description}</p>}
      </div>
    </article>
  );
}
