import Link from "next/link";

import { CatalogCard } from "@/components/catalog/CatalogCard";
import { PageHeader } from "@/components/catalog/PageHeader";

export type CatalogBreadcrumb = {
  href: string;
  label: string;
};

export type CatalogListingItem = {
  key: string;
  href: string;
  title: string;
  description?: string;
  meta?: string | null;
  imageUrl?: string | null;
  imageAlt?: string;
};

type CatalogListingPageProps = {
  title: string;
  description?: string;
  breadcrumbs: CatalogBreadcrumb[];
  items: CatalogListingItem[];
  emptyMessage?: string;
  footerLink?: {
    href: string;
    label: string;
  };
};

export function CatalogListingPage({
  title,
  description,
  breadcrumbs,
  items,
  emptyMessage,
  footerLink,
}: CatalogListingPageProps) {
  return (
    <div className="section-inner">
      <PageHeader title={title} description={description} breadcrumbs={breadcrumbs} />

      {items.length > 0 ? (
        <div className="section-grid">
          {items.map((item) => (
            <CatalogCard
              key={item.key}
              href={item.href}
              title={item.title}
              description={item.description}
              meta={item.meta}
              imageUrl={item.imageUrl}
              imageAlt={item.imageAlt}
            />
          ))}
        </div>
      ) : (
        emptyMessage && <p className="section-description">{emptyMessage}</p>
      )}

      {footerLink && (
        <p className="mt-8">
          <Link href={footerLink.href} className="btn-glass inline-flex">
            {footerLink.label}
          </Link>
        </p>
      )}
    </div>
  );
}
