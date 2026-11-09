import { ServicePage } from "@/components/content/ServicePage";
import { ROUTES } from "@/constants/navigation";
import { getPublishedStubOverlay } from "@/lib/content/getPageContent";
import { getPageRegistryEntry } from "@/lib/content/pages/registry";
import { createPageMetadata, textOrFallback } from "@/lib/seo/metadata";

const PAGE_KEY = "shop-warranty" as const;

export async function generateMetadata() {
  const page = await getPublishedStubOverlay(PAGE_KEY);
  const entry = getPageRegistryEntry(PAGE_KEY);
  return createPageMetadata({
    title: textOrFallback(page?.seoTitle, entry.title),
    description: textOrFallback(page?.seoDescription, entry.description || entry.title),
    path: ROUTES.shopWarranty,
  });
}

export default async function ShopWarrantyPage() {
  const page = await getPublishedStubOverlay(PAGE_KEY);
  const entry = getPageRegistryEntry(PAGE_KEY);
  return (
    <ServicePage
      runtimePageKey={PAGE_KEY}
      kicker={page?.hero.eyebrow ?? ""}
      title={page?.hero.title ?? entry.title}
      description={page?.hero.lead ?? ""}
      breadcrumbs={[
        { href: ROUTES.shop, label: "BIZON Shop" },
        { href: ROUTES.shopWarranty, label: entry.title },
      ]}
      media={page?.hero.imageUrl ? { src: page.hero.imageUrl, alt: page.hero.imageAlt ?? "" } : undefined}
      editorial={page ?? undefined}
      featuresHeading={page?.featuresHeading ?? ""}
      features={page?.features ?? []}
    />
  );
}
