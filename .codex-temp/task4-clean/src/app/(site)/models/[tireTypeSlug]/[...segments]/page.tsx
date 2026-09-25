import { notFound, redirect } from "next/navigation";

import { TireDirectionPage } from "@/components/catalog/TireDirectionPage";
import { TireModelStage } from "@/components/catalog/TireModelStage";
import { getTireCategoryBySlug } from "@/lib/catalog/tireCategories";
import { parseTireFilters } from "@/lib/catalog/tireFilters";
import { getPublishedTireCatalog } from "@/lib/catalog/getPublishedTireCatalog";
import {
  getAllTireModelRouteParams,
  getTireModelByTypeAndSlug,
  getTireTypeBySlug,
  getTireVariantsByModelId,
} from "@/lib/cms";
import { createPageMetadata } from "@/lib/seo/metadata";
import { createProductStructuredData } from "@/lib/seo/structuredData";

type PageProps = {
  params: Promise<{ tireTypeSlug: string; segments: string[] }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateStaticParams() {
  const routes = await getAllTireModelRouteParams();
  return routes.map((route) => ({
    tireTypeSlug: route.tireTypeSlug,
    segments: [route.modelSlug],
  }));
}

export async function generateMetadata({ params }: PageProps) {
  const { tireTypeSlug, segments } = await params;
  const category = segments.length >= 1 ? getTireCategoryBySlug(segments[0]) : undefined;

  if (category && segments.length === 1) {
    const tireType = await getTireTypeBySlug(tireTypeSlug);
    if (!tireType) return {};
    return createPageMetadata({
      title: `${category.name} — ${tireType.name}`,
      description: category.description,
      path: `/models/${tireType.slug}/${category.slug}`,
    });
  }

  const modelSlug = segments.length === 2 ? segments[1] : segments[0];
  if (!modelSlug) return {};
  const model = await getTireModelByTypeAndSlug(tireTypeSlug, modelSlug);
  if (!model) return {};
  const catalog = await getPublishedTireCatalog();
  const catalogModel = catalog.directions
    .find((direction) => direction.slug === tireTypeSlug)
    ?.models.find((item) => item.slug === modelSlug);
  return createPageMetadata({
    title: model.name,
    description: model.descriptionShort,
    path: catalogModel?.href ?? `/models/${tireTypeSlug}/${modelSlug}`,
  });
}

async function TireCategoryRoute({
  tireTypeSlug,
  categorySlug,
  rawFilters,
}: {
  tireTypeSlug: string;
  categorySlug: string;
  rawFilters: Record<string, string | string[] | undefined>;
}) {
  const catalog = await getPublishedTireCatalog();
  const direction = catalog.directions.find((item) => item.slug === tireTypeSlug);
  if (!direction || !getTireCategoryBySlug(categorySlug)) notFound();

  return (
    <TireDirectionPage
      direction={direction}
      filters={parseTireFilters(rawFilters)}
      categorySlug={categorySlug}
    />
  );
}

async function TireModelRoute({
  tireTypeSlug,
  modelSlug,
  requestedPath,
}: {
  tireTypeSlug: string;
  modelSlug: string;
  requestedPath: string;
}) {
  const [catalog, model] = await Promise.all([
    getPublishedTireCatalog(),
    getTireModelByTypeAndSlug(tireTypeSlug, modelSlug),
  ]);
  const catalogModel = catalog.directions
    .find((direction) => direction.slug === tireTypeSlug)
    ?.models.find((item) => item.slug === modelSlug);
  if (!model || !catalogModel) notFound();

  if (requestedPath !== catalogModel.href) redirect(catalogModel.href);

  const variants = await getTireVariantsByModelId(model.id);
  const category = getTireCategoryBySlug(catalogModel.href.split("/").at(-2) ?? "");
  const typePath = `/models/${tireTypeSlug}`;
  const breadcrumbs = [
    { href: "/", label: "Главная" },
    { href: "/models", label: "Каталог" },
    { href: typePath, label: catalogModel.tireTypeName },
    ...(category
      ? [{ href: `${typePath}/${category.slug}`, label: category.name }]
      : []),
    { href: catalogModel.href, label: catalogModel.name },
  ];
  const structuredData = createProductStructuredData({
    name: catalogModel.name,
    description: catalogModel.descriptionShort,
    path: catalogModel.href,
    brand: catalogModel.brand,
    category: catalogModel.tireTypeName,
  });

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <TireModelStage
        model={catalogModel}
        variants={variants}
        modelPath={catalogModel.href}
        breadcrumbs={breadcrumbs}
      />
    </>
  );
}

export default async function TireRoutePage({ params, searchParams }: PageProps) {
  const [{ tireTypeSlug, segments }, rawFilters] = await Promise.all([
    params,
    searchParams,
  ]);
  if (segments.length === 1 && getTireCategoryBySlug(segments[0])) {
    return (
      <TireCategoryRoute
        tireTypeSlug={tireTypeSlug}
        categorySlug={segments[0]}
        rawFilters={rawFilters}
      />
    );
  }
  if (segments.length === 1) {
    return (
      <TireModelRoute
        tireTypeSlug={tireTypeSlug}
        modelSlug={segments[0]}
        requestedPath={`/models/${tireTypeSlug}/${segments[0]}`}
      />
    );
  }
  if (segments.length === 2) {
    return (
      <TireModelRoute
        tireTypeSlug={tireTypeSlug}
        modelSlug={segments[1]}
        requestedPath={`/models/${tireTypeSlug}/${segments.join("/")}`}
      />
    );
  }
  notFound();
}
