import { notFound } from "next/navigation";
import { ServicePage } from "@/components/content/ServicePage";
import { ROUTES } from "@/constants/navigation";
import { getPublishedStubOverlay } from "@/lib/content/getPageContent";
import { createPageMetadata } from "@/lib/seo/metadata";

export async function generateMetadata() {
  const page = await getPublishedStubOverlay("branding");
  return createPageMetadata({
    title: page?.seoTitle ?? "",
    description: page?.seoDescription ?? "",
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
