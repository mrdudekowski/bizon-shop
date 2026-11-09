import { notFound } from "next/navigation";
import { ServicePage } from "@/components/content/ServicePage";
import { ROUTES } from "@/constants/navigation";
import { getPublishedStubOverlay } from "@/lib/content/getPageContent";
import { getPageRegistryEntry } from "@/lib/content/pages/registry";
import { createPageMetadata, textOrFallback } from "@/lib/seo/metadata";

export async function generateMetadata() {
  const page = await getPublishedStubOverlay("about");
  const entry = getPageRegistryEntry("about");
  return createPageMetadata({
    title: textOrFallback(page?.seoTitle, entry.title),
    description: textOrFallback(page?.seoDescription, entry.description || entry.title),
    path: ROUTES.about,
  });
}

export default async function AboutPage() {
  const page = await getPublishedStubOverlay("about");
  if (!page) notFound();
  return (
    <ServicePage
      runtimePageKey="about"
      kicker={page?.hero.eyebrow ?? ""}
      title={page?.hero.title ?? ""}
      description={page?.hero.lead ?? ""}
      breadcrumbs={[
        { href: ROUTES.home, label: "Главная" },
        { href: ROUTES.about, label: "О компании" },
      ]}
      media={page?.hero.imageUrl ? { src: page.hero.imageUrl, alt: page.hero.imageAlt ?? "" } : undefined}
      editorial={page}
      featuresHeading={page?.featuresHeading ?? ""}
      features={page?.features ?? []}
    />
  );
}
