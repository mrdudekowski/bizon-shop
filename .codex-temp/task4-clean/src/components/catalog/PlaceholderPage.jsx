import Link from "next/link";
import { PageHeader } from "@/components/catalog/PageHeader";

export function PlaceholderPage({
  title,
  description,
  breadcrumbs,
  body,
  ctaHref,
  ctaLabel,
}) {
  return (
    <div className="section-inner">
      <PageHeader title={title} description={description} breadcrumbs={breadcrumbs} />
      <article className="card-base info-card max-w-3xl">
        <p className="info-card-text">{body}</p>
      </article>
      {ctaHref && ctaLabel && (
        <p className="mt-8">
          <Link href={ctaHref} className="btn-accent inline-flex">
            {ctaLabel}
          </Link>
        </p>
      )}
    </div>
  );
}
