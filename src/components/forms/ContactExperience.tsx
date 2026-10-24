"use client";

import { useSearchParams } from "next/navigation";

import { ServicePage } from "@/components/content/ServicePage";
import { ContextualContactForm } from "@/components/forms/ContextualContactForm";
import { resolveContactIntent } from "@/lib/requests/contactIntent";
import type { PublishedStubOverlay } from "@/lib/content/getPageContent";

export function ContactExperience({ page }: { page: PublishedStubOverlay | null }) {
  const intent = resolveContactIntent(useSearchParams());
  return (
    <ServicePage
      runtimePageKey="contact"
      kicker={page?.hero.eyebrow ?? ""}
      title={page?.hero.title ?? ""}
      description={page?.hero.lead ?? ""}
      breadcrumbs={[{ href: "/", label: "Главная" }, { href: "/contact", label: "Контакты" }]}
      media={page?.hero.imageUrl ? { src: page.hero.imageUrl, alt: page.hero.imageAlt ?? "" } : undefined}
      editorial={page ?? undefined}
      renderChildrenWithEditorial
      featuresHeading={page?.featuresHeading ?? ""}
      features={page?.features ?? []}
    >
      <div className="section-inner" style={{ paddingTop: 0, paddingBottom: "var(--section-space)" }}>
        <ContextualContactForm intent={intent} />
      </div>
    </ServicePage>
  );
}
