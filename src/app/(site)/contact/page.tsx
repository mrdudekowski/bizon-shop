import { PageHero } from "@/components/content/PageHero";
import { ContextualContactForm } from "@/components/forms/ContextualContactForm";
import { getPublishedStubOverlay } from "@/lib/content/getPageContent";
import { resolveContactIntent } from "@/lib/requests/contactIntent";
import { createPageMetadata } from "@/lib/seo/metadata";

export async function generateMetadata() {
  const page = await getPublishedStubOverlay("contact");
  return createPageMetadata({
    title: page?.seoTitle || "Контакты",
    description: page?.seoDescription || "Свяжитесь с BIZON для расчёта, консультации по шинам или вопросам парка.",
    path: "/contact",
  });
}

type PageProps = { searchParams: Promise<Record<string, string | string[] | undefined>> };

function toUrlSearchParams(source: Record<string, string | string[] | undefined>) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(source)) {
    if (Array.isArray(value)) value.forEach((item) => params.append(key, item));
    else if (value != null) params.set(key, value);
  }
  return params;
}

export default async function ContactPage({ searchParams }: PageProps) {
  const intent = resolveContactIntent(toUrlSearchParams(await searchParams));
  const page = await getPublishedStubOverlay("contact");

  return (
    <div data-main-chrome-tone="light">
      <PageHero
        kicker={page?.hero.eyebrow || "BIZON · Заявка"}
        title={page?.hero.title || intent.title}
        description={page?.hero.lead || intent.description}
        breadcrumbs={[
          { href: "/", label: "Главная" },
          { href: "/contact", label: "Контакты" },
        ]}
      />
      <div className="section-inner" style={{ paddingTop: 0, paddingBottom: "var(--section-space)" }}>
        <ContextualContactForm intent={intent} />
      </div>
    </div>
  );
}
