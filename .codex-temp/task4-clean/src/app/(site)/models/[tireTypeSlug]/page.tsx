import { notFound } from "next/navigation";
import {
  getAllTireTypeSlugs,
  getTireModelsByTypeSlug,
  getTireTypeBySlug,
} from "@/lib/cms";
import { getApplicationCategoryLabel } from "@/lib/cms/applicationCategory";
import { createPageMetadata } from "@/lib/seo/metadata";
import { CatalogListingPage } from "@/components/catalog/CatalogListingPage";

type PageProps = {
  params: Promise<{ tireTypeSlug: string }>;
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

export default async function TireTypeModelsPage({ params }: PageProps) {
  const { tireTypeSlug } = await params;
  const tireType = await getTireTypeBySlug(tireTypeSlug);

  if (!tireType) {
    notFound();
  }

  const models = await getTireModelsByTypeSlug(tireType.slug);
  const typeBasePath = `/models/${tireType.slug}`;

  return (
    <CatalogListingPage
      title={tireType.name}
      description={tireType.description}
      breadcrumbs={[
        { href: "/", label: "Главная" },
        { href: "/models", label: "Модели" },
        { href: typeBasePath, label: tireType.name },
      ]}
      items={models.map((model) => ({
        key: model.slug,
        href: `${typeBasePath}/${model.slug}`,
        title: model.name,
        description: model.descriptionShort,
        meta: `${model.brand} · ${getApplicationCategoryLabel(model.applicationCategory)}`,
        imageUrl: model.imageUrl,
        imageAlt: model.name,
      }))}
      emptyMessage="Модели этого типа скоро появятся."
      footerLink={{ href: "/models", label: "← Все типы шин" }}
    />
  );
}
