import { Suspense } from "react";
import { PageHero } from "@/components/content/PageHero";
import { ContactExperience } from "@/components/forms/ContactExperience";
import { getPublishedStubOverlay } from "@/lib/content/getPageContent";
import { createPageMetadata } from "@/lib/seo/metadata";

export async function generateMetadata() {
  const page = await getPublishedStubOverlay("contact");
  return createPageMetadata({
    title: page?.seoTitle || "Контакты",
    description: page?.seoDescription || "Свяжитесь с BIZON для расчёта, консультации по шинам или вопросам парка.",
    path: "/contact",
  });
}

export default async function ContactPage() {
  const page = await getPublishedStubOverlay("contact");

  return (
    <div data-main-chrome-tone="light">
      <Suspense fallback={<PageHero kicker="BIZON · Заявка" title="Контакты" description="Расчёт, консультация по шинам и вопросы для fleet-операторов." breadcrumbs={[{ href: "/", label: "Главная" }, { href: "/contact", label: "Контакты" }]} />}>
        <ContactExperience page={page} />
      </Suspense>
    </div>
  );
}
