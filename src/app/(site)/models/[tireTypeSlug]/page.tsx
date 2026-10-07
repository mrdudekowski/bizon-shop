import { notFound } from "next/navigation";
import { PublishedContentUnavailable } from "@/components/content/PublishedContentUnavailable";
import {
  getAllTireTypeSlugs,
  getPublishedTireCatalog,
  getTireTypeBySlug,
} from "@/lib/content";
import { TireDirectionPage } from "@/components/catalog/TireDirectionPage";
import { parseTireFilters } from "@/lib/catalog/tireFilters";
import { createPageMetadata } from "@/lib/seo/metadata";
import { loadPublished } from "@/lib/content/loadPublished";

type PageProps = {
  params: Promise<{ tireTypeSlug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateStaticParams() {
  const loaded = await loadPublished(getAllTireTypeSlugs);
  const slugs = loaded.kind === "ok" ? loaded.value : [];
  return slugs.map((tireTypeSlug) => ({ tireTypeSlug }));
}

export async function generateMetadata({ params }: PageProps) {
  const { tireTypeSlug } = await params;
  const loaded = await loadPublished(() => getTireTypeBySlug(tireTypeSlug));
  const tireType = loaded.kind === "ok" ? loaded.value : null;
  if (!tireType) return {};
  return createPageMetadata({
    title: tireType.name,
    description: tireType.description,
    path: `/models/${tireType.slug}`,
  });
}

export default async function TireTypeModelsPage({ params, searchParams }: PageProps) {
  const [{ tireTypeSlug }, rawFilters] = await Promise.all([
    params,
    searchParams,
  ]);
  const loaded = await loadPublished(getPublishedTireCatalog);
  if (loaded.kind === "unavailable") {
    return (
      <PublishedContentUnavailable
        title="Каталог шин временно недоступен"
        message="Не получилось загрузить модели. Попробуйте ещё раз через минуту."
      />
    );
  }
  const catalog = loaded.value;
  const direction = catalog.directions.find((item) => item.slug === tireTypeSlug);

  if (!direction) notFound();

  return <TireDirectionPage direction={direction} filters={parseTireFilters(rawFilters)} />;
}
