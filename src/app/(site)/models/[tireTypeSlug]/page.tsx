import { Suspense } from "react";
import { notFound } from "next/navigation";
import { PublishedContentUnavailable } from "@/components/content/PublishedContentUnavailable";
import {
  getAllTireTypeSlugs,
  getPublishedTireCatalog,
  getTireTypeBySlug,
} from "@/lib/content";
import { TireDirectionPage } from "@/components/catalog/TireDirectionPage";
import { createPageMetadata } from "@/lib/seo/metadata";
import { loadPublished } from "@/lib/content/loadPublished";

type PageProps = {
  params: Promise<{ tireTypeSlug: string }>;
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

export default async function TireTypeModelsPage({ params }: PageProps) {
  const { tireTypeSlug } = await params;
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

  return <Suspense fallback={null}><TireDirectionPage direction={direction} filters={{}} /></Suspense>;
}
