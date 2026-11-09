import { notFound } from "next/navigation";
import { ServicePage } from "@/components/content/ServicePage";
import { ROUTES } from "@/constants/navigation";
import { getPublishedStubOverlay } from "@/lib/content/getPageContent";
import { getPageRegistryEntry } from "@/lib/content/pages/registry";
import { createPageMetadata, textOrFallback } from "@/lib/seo/metadata";

export async function generateMetadata() {
  const page = await getPublishedStubOverlay("branding");
  const entry = getPageRegistryEntry("branding");
  return createPageMetadata({
    title: textOrFallback(page?.seoTitle, entry.title),
    description: textOrFallback(page?.seoDescription, entry.description || entry.title),
    path: "/branding",
  });
}

export default async function BrandingPage() {
  const page = await getPublishedStubOverlay("branding");
  if (!page) notFound();
  return (
    <ServicePage
      runtimePageKey="branding"
      kicker={page?.hero.eyebrow ?? ""}
      title={page?.hero.title ?? ""}
      description={page?.hero.lead ?? ""}
      breadcrumbs={[
        { href: ROUTES.home, label: "Главная" },
        { href: ROUTES.branding, label: "Брендирование" },
      ]}
      media={page?.hero.imageUrl ? { src: page.hero.imageUrl, alt: page.hero.imageAlt ?? "" } : undefined}
      editorial={page}
      featuresHeading={page?.featuresHeading ?? ""}
      features={page?.features ?? []}
    />
  );
}
