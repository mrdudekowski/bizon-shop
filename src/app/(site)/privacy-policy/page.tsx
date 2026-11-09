import { notFound } from "next/navigation";
import { LegalRequisites } from "@/components/content/LegalRequisites";
import { ServicePage } from "@/components/content/ServicePage";
import { ROUTES } from "@/constants/navigation";
import { getPublishedStubOverlay } from "@/lib/content/getPageContent";
import { PLACEHOLDER_SITE_PROFILE } from "@/lib/content/siteProfile";
import { getPageRegistryEntry } from "@/lib/content/pages/registry";
import { createPageMetadata, textOrFallback } from "@/lib/seo/metadata";

export async function generateMetadata() {
  const page = await getPublishedStubOverlay("privacy-policy");
  const entry = getPageRegistryEntry("privacy-policy");
  return createPageMetadata({
    title: textOrFallback(page?.seoTitle, entry.title),
    description: textOrFallback(page?.seoDescription, entry.description || entry.title),
    path: "/privacy-policy",
  });
}

export default async function PrivacyPolicyPage() {
  const [page, contactPage] = await Promise.all([
    getPublishedStubOverlay("privacy-policy"),
    getPublishedStubOverlay("contact"),
  ]);
  if (!page) notFound();
  const siteProfile = contactPage?.siteProfile ?? PLACEHOLDER_SITE_PROFILE;
  return (
    <ServicePage
      runtimePageKey="privacy-policy"
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
      renderChildrenWithEditorial
    >
      <LegalRequisites siteProfile={siteProfile} />
    </ServicePage>
  );
}
