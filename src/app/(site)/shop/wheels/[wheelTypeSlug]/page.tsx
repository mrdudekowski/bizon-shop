import { notFound } from "next/navigation";
import { WheelTypeRuntime } from "@/components/catalog/WheelTypeRuntime";
import {
  getAllWheelTypeSlugs,
  getWheelModelsByTypeSlug,
  getWheelTypeBySlug,
  getWheelVariantsByTypeSlug,
} from "@/lib/content";
import { createPageMetadata } from "@/lib/seo/metadata";
import { ForgedCatalog } from "@/components/shop/ForgedCatalog";
import { PublishedContentUnavailable } from "@/components/content/PublishedContentUnavailable";
import { loadPublished } from "@/lib/content/loadPublished";

type PageProps = {
  params: Promise<{ wheelTypeSlug: string }>;
};

export async function generateStaticParams() {
  const loaded = await loadPublished(getAllWheelTypeSlugs);
  const slugs = loaded.kind === "ok" ? loaded.value : [];
  return [...new Set(["forged", ...slugs])].map((wheelTypeSlug) => ({ wheelTypeSlug }));
}

export async function generateMetadata({ params }: PageProps) {
  const { wheelTypeSlug } = await params;
  const loaded = await loadPublished(() => getWheelTypeBySlug(wheelTypeSlug));
  const wheelType = loaded.kind === "ok" ? loaded.value : null;
  if (!wheelType) return {};
  return createPageMetadata({
    title: wheelType.seoTitle?.trim() || wheelType.name,
    description: wheelType.seoDescription?.trim() || wheelType.shortDescription || wheelType.description,
    path: `/shop/wheels/${wheelType.slug}`,
  });
}

export default async function WheelTypePage({ params }: PageProps) {
  const { wheelTypeSlug } = await params;
  const loaded = await loadPublished(async () => {
    const wheelType = await getWheelTypeBySlug(wheelTypeSlug);
    if (!wheelType) return null;
    if (wheelTypeSlug.toLowerCase() === "forged") {
      const [models, variants] = await Promise.all([
        getWheelModelsByTypeSlug(wheelType.slug),
        getWheelVariantsByTypeSlug(wheelType.slug),
      ]);
      return { wheelType, models, variants };
    }
    const [models, variants] = await Promise.all([
      getWheelModelsByTypeSlug(wheelType.slug),
      getWheelVariantsByTypeSlug(wheelType.slug),
    ]);
    return { wheelType, models, variants };
  });
  if (loaded.kind === "unavailable") return <PublishedContentUnavailable />;
  if (!loaded.value) notFound();
  const { wheelType, models, variants } = loaded.value;
  if (wheelTypeSlug.toLowerCase() === "forged") {
    return <ForgedCatalog wheelType={wheelType} models={models} variants={variants} />;
  }

  return <WheelTypeRuntime type={wheelType} models={models} variants={variants} />;
}
