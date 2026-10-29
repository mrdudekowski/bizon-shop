import { notFound } from "next/navigation";
import { ServicePage } from "@/components/content/ServicePage";
import { ConfiguredForm } from "@/components/forms/ConfiguredForm";
import { ROUTES } from "@/constants/navigation";
import { getPublishedStubOverlay } from "@/lib/content/getPageContent";
import { createPageMetadata } from "@/lib/seo/metadata";

export async function generateMetadata() {
  const page = await getPublishedStubOverlay("delivery-geography");
  return createPageMetadata({
    title: page?.seoTitle ?? "",
    description: page?.seoDescription ?? "",
    path: ROUTES.deliveryGeography,
  });
}

export default async function DeliveryGeographyPage() {
  const page = await getPublishedStubOverlay("delivery-geography");
  if (!page) notFound();

  return (
    <ServicePage
      runtimePageKey="delivery-geography"
      kicker={page.hero.eyebrow ?? ""}
      title={page.hero.title ?? ""}
      description={page.hero.lead ?? ""}
      breadcrumbs={[
        { href: ROUTES.home, label: "Главная" },
        { href: ROUTES.deliveryGeography, label: "География поставок" },
      ]}
      media={page.hero.imageUrl ? { src: page.hero.imageUrl, alt: page.hero.imageAlt ?? "" } : undefined}
      editorial={page}
      featuresHeading={page.featuresHeading ?? ""}
      features={page.features ?? []}
      renderChildrenWithEditorial
    >
      {page.form ? <ConfiguredForm form={page.form} sourceForm="delivery_quote" /> : null}
    </ServicePage>
  );
}
