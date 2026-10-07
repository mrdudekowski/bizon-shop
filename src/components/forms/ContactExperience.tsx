"use client";

import { useSearchParams } from "next/navigation";

import { PageHero } from "@/components/content/PageHero";
import { ContextualContactForm } from "@/components/forms/ContextualContactForm";
import { resolveContactIntent } from "@/lib/requests/contactIntent";
import type { PublishedStubOverlay } from "@/lib/content/getPageContent";

export function ContactExperience({ page }: { page: PublishedStubOverlay | null }) {
  const intent = resolveContactIntent(useSearchParams());
  return (
    <>
      <PageHero
        kicker={page?.hero.eyebrow || "BIZON · Заявка"}
        title={page?.hero.title || intent.title}
        description={page?.hero.lead || intent.description}
        breadcrumbs={[{ href: "/", label: "Главная" }, { href: "/contact", label: "Контакты" }]}
      />
      <div className="section-inner" style={{ paddingTop: 0, paddingBottom: "var(--section-space)" }}>
        <ContextualContactForm intent={intent} />
      </div>
    </>
  );
}
