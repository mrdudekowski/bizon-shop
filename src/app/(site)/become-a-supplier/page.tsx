import { notFound } from "next/navigation";
import { ServicePage } from "@/components/content/ServicePage";
import { ROUTES } from "@/constants/navigation";
import { getPublishedStubOverlay } from "@/lib/content/getPageContent";
import { getPageRegistryEntry } from "@/lib/content/pages/registry";
import { createPageMetadata, textOrFallback } from "@/lib/seo/metadata";

export async function generateMetadata() {
  const page = await getPublishedStubOverlay("become-a-supplier");
  const entry = getPageRegistryEntry("become-a-supplier");
  return createPageMetadata({
    title: textOrFallback(page?.seoTitle, entry.title),
    description: textOrFallback(page?.seoDescription, entry.description || entry.title),
    path: "/become-a-supplier",
  });
}

export default async function BecomeASupplierPage() {
  const page = await getPublishedStubOverlay("become-a-supplier");
  if (!page) notFound();
  return (
    <ServicePage
      runtimePageKey="become-a-supplier"
      kicker={page?.hero.eyebrow ?? ""}
      title={page?.hero.title ?? ""}
      description={page?.hero.lead ?? ""}
      breadcrumbs={[
        { href: ROUTES.home, label: "Главная" },
        { href: ROUTES.supplier, label: "Стать поставщиком" },
      ]}
      media={page?.hero.imageUrl ? { src: page.hero.imageUrl, alt: page.hero.imageAlt ?? "" } : undefined}
      editorial={page}
      featuresHeading={page?.featuresHeading ?? ""}
      features={page?.features ?? []}
    />
  );
}
