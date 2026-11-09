import { notFound } from "next/navigation";
import { ServicePage } from "@/components/content/ServicePage";
import { ROUTES } from "@/constants/navigation";
import { getPublishedStubOverlay } from "@/lib/content/getPageContent";
import { getPageRegistryEntry } from "@/lib/content/pages/registry";
import { createPageMetadata, textOrFallback } from "@/lib/seo/metadata";

export async function generateMetadata() {
  const page = await getPublishedStubOverlay("warranty");
  const entry = getPageRegistryEntry("warranty");
  return createPageMetadata({
    title: textOrFallback(page?.seoTitle, entry.title),
    description: textOrFallback(page?.seoDescription, entry.description || entry.title),
    path: ROUTES.warranty,
  });
}

export default async function WarrantyPage() {
  const page = await getPublishedStubOverlay("warranty");
  if (!page) notFound();
  return (
    <ServicePage
      runtimePageKey="warranty"
      kicker={page?.hero.eyebrow ?? ""}
      title={page?.hero.title ?? ""}
      description={page?.hero.lead ?? ""}
      documents={page?.documents}
      breadcrumbs={[
        { href: ROUTES.home, label: "Главная" },
        { href: ROUTES.warranty, label: "Гарантия и возврат" },
      ]}
      media={page?.hero.imageUrl ? { src: page.hero.imageUrl, alt: page.hero.imageAlt ?? "" } : undefined}
      editorial={page}
      featuresHeading={page?.featuresHeading ?? ""}
      features={page?.features ?? []}
    />
  );
}
