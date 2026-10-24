import { notFound } from "next/navigation";
import { ServicePage } from "@/components/content/ServicePage";
import { ROUTES } from "@/constants/navigation";
import { getPublishedStubOverlay } from "@/lib/content/getPageContent";
import { createPageMetadata } from "@/lib/seo/metadata";

export async function generateMetadata() {
  const page = await getPublishedStubOverlay("privacy-policy");
  return createPageMetadata({
    title: page?.seoTitle ?? "",
    description: page?.seoDescription ?? "",
    path: "/privacy-policy",
  });
}

export default async function PrivacyPolicyPage() {
  const page = await getPublishedStubOverlay("privacy-policy");
  if (!page) notFound();
  return (
    <ServicePage
      kicker={page?.hero.eyebrow ?? ""}
      title={page?.hero.title ?? ""}
      description={page?.hero.lead ?? ""}
      documents={page?.documents}
      breadcrumbs={[
        { href: ROUTES.home, label: "Главная" },
        { href: ROUTES.privacyPolicy, label: "Политика конфиденциальности" },
      ]}
      featuresHeading={page?.featuresHeading ?? ""}
      features={page?.features ?? []}
      editorial={page}
      notice={undefined}
    />
  );
}
