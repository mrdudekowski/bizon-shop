import { notFound } from "next/navigation";
import {
  getAllTireTypeSlugs,
  getPublishedTireCatalog,
  getTireTypeBySlug,
} from "@/lib/content";
import { TireDirectionPage } from "@/components/catalog/TireDirectionPage";
import { parseTireFilters } from "@/lib/catalog/tireFilters";
import { createPageMetadata } from "@/lib/seo/metadata";

type PageProps = {
  params: Promise<{ tireTypeSlug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateStaticParams() {
  const slugs = await getAllTireTypeSlugs();
  return slugs.map((tireTypeSlug) => ({ tireTypeSlug }));
}

export async function generateMetadata({ params }: PageProps) {
  const { tireTypeSlug } = await params;
  const tireType = await getTireTypeBySlug(tireTypeSlug);
  if (!tireType) return {};
  return createPageMetadata({
    title: tireType.name,
    description: tireType.description,
    path: `/models/${tireType.slug}`,
  });
}

export default async function TireTypeModelsPage({ params, searchParams }: PageProps) {
  const [{ tireTypeSlug }, rawFilters, catalog] = await Promise.all([
    params,
    searchParams,
    getPublishedTireCatalog(),
  ]);
  const direction = catalog.directions.find((item) => item.slug === tireTypeSlug);

  if (!direction) notFound();

  return <TireDirectionPage direction={direction} filters={parseTireFilters(rawFilters)} />;
}
