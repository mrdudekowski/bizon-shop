import { PageHero } from "@/components/content/PageHero";
import { ContextualContactForm } from "@/components/forms/ContextualContactForm";
import { getPublishedTireCatalog } from "@/lib/content";
import { resolveContactIntent } from "@/lib/requests/contactIntent";
import {
  normalizeSelectionContext,
  type NormalizedSelectionContext,
} from "@/lib/requests/selectionContext";
import { createPageMetadata } from "@/lib/seo/metadata";
import { parseSelectionParams } from "@/lib/selection/urlState";

export const metadata = createPageMetadata({
  title: "Контакты",
  description: "Свяжитесь с BIZON для расчёта, подбора шин или консультации по парку.",
  path: "/contact",
});

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
  const raw = await searchParams;
  const params = toUrlSearchParams(raw);
  const state = parseSelectionParams(params);
  const requestedModels = params.getAll("model");
  const hasSelection = Boolean(
    state.vehicle ||
      state.conditions.length ||
      state.axle ||
      state.size ||
      requestedModels.length,
  );
  let context: NormalizedSelectionContext | undefined;

  if (hasSelection) {
    let validModels: string[] = [];
    try {
      const catalog = await getPublishedTireCatalog();
      const published = new Set(
        catalog.directions.flatMap((direction) =>
          direction.models.map((model) => model.slug),
        ),
      );
      validModels = requestedModels.filter((slug) => published.has(slug));
    } catch (error) {
      console.error("Unable to validate contact model context", error);
    }
    context = normalizeSelectionContext({
      vehicle: state.vehicle,
      conditions: state.conditions,
      axle: state.axle,
      size: state.sizeKnown ? state.size : undefined,
      modelSlugs: validModels,
    });
  }

  const intent = resolveContactIntent(params, { hasSelectionContext: Boolean(context) });

  return (
    <div data-main-chrome-tone="light">
      <PageHero
        kicker="BIZON · Заявка"
        title={intent.title}
        description={intent.description}
        breadcrumbs={[
          { href: "/", label: "Главная" },
          { href: "/contact", label: "Контакты" },
        ]}
      />
      <div className="section-inner" style={{ paddingTop: 0, paddingBottom: "var(--section-space)" }}>
        <ContextualContactForm context={context} intent={intent} />
      </div>
    </div>
  );
}
