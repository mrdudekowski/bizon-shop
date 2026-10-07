import { notFound, redirect } from "next/navigation";

import { PublishedContentUnavailable } from "@/components/content/PublishedContentUnavailable";
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
} from "@/lib/content";
import { createPageMetadata } from "@/lib/seo/metadata";
import { createProductStructuredData } from "@/lib/seo/structuredData";
import { loadPublished } from "@/lib/content/loadPublished";

type PageProps = {
  params: Promise<{ tireTypeSlug: string; segments: string[] }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateStaticParams() {
  const loaded = await loadPublished(async () => {
    const [routes, catalog] = await Promise.all([
      getAllTireModelRouteParams(),
      getPublishedTireCatalog(),
    ]);
    return { routes, catalog };
  });
  if (loaded.kind === "unavailable") return [];
  const { routes, catalog } = loaded.value;
  return routes.map((route) => ({
    tireTypeSlug: route.tireTypeSlug,
    segments:
      catalog.directions
        .find((direction) => direction.slug === route.tireTypeSlug)
        ?.models.find((model) => model.slug === route.modelSlug)
        ?.href.split("/")
        .filter(Boolean)
        .slice(2) ?? [route.modelSlug],
  }));
}

export async function generateMetadata({ params }: PageProps) {
  const { tireTypeSlug, segments } = await params;
  const category = segments.length >= 1 ? getTireCategoryBySlug(segments[0]) : undefined;

  if (category && segments.length === 1) {
    const loaded = await loadPublished(() => getTireTypeBySlug(tireTypeSlug));
    const tireType = loaded.kind === "ok" ? loaded.value : null;
    if (!tireType) return {};
    return createPageMetadata({
      title: `${category.name} — ${tireType.name}`,
      description: category.description,
      path: `/models/${tireType.slug}/${category.slug}`,
    });
  }

  const modelSlug = segments.length === 2 ? segments[1] : segments[0];
  if (!modelSlug) return {};
  const loaded = await loadPublished(async () => {
    const model = await getTireModelByTypeAndSlug(tireTypeSlug, modelSlug);
    if (!model) return null;
    const catalog = await getPublishedTireCatalog();
    return { model, catalog };
  });
  if (loaded.kind === "unavailable") return {};
  const modelData = loaded.value;
  const model = modelData?.model;
  if (!model) return {};
  const catalog = modelData.catalog;
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
  const loaded = await loadPublished(async () => {
    const [catalog, model] = await Promise.all([
      getPublishedTireCatalog(),
      getTireModelByTypeAndSlug(tireTypeSlug, modelSlug),
    ]);
    if (!model) return null;
    const variants = await getTireVariantsByModelId(model.id);
    return { catalog, model, variants };
  });
  if (loaded.kind === "unavailable") {
    return (
      <PublishedContentUnavailable
        title="Каталог шин временно недоступен"
        message="Не получилось загрузить модель. Попробуйте ещё раз через минуту."
      />
    );
  }
  if (!loaded.value) notFound();
  const { catalog, model } = loaded.value;
  const catalogModel = catalog.directions
    .find((direction) => direction.slug === tireTypeSlug)
    ?.models.find((item) => item.slug === modelSlug);
  if (catalogModel && requestedPath !== catalogModel.href) redirect(catalogModel.href);

  const { variants } = loaded.value;
  const modelPath =
    catalogModel?.href || requestedPath || `/models/${tireTypeSlug}/${modelSlug}`;
  const hydratedModel = catalogModel ?? {
    ...model,
    href: modelPath,
    sizes: variants.map((variant) => variant.size),
  };
  const category = catalogModel
    ? getTireCategoryBySlug(catalogModel.href.split("/").at(-2) ?? "")
    : undefined;
  const typePath = `/models/${tireTypeSlug}`;
  const breadcrumbs = [
    { href: "/", label: "Главная" },
    { href: "/models", label: "Каталог" },
    { href: typePath, label: hydratedModel.tireTypeName },
    ...(category
      ? [{ href: `${typePath}/${category.slug}`, label: category.name }]
      : []),
    { href: modelPath, label: hydratedModel.name },
  ];
  const structuredData = createProductStructuredData({
    name: hydratedModel.name,
    description: hydratedModel.descriptionShort,
    path: modelPath,
    brand: hydratedModel.brand,
    category: hydratedModel.tireTypeName,
  });

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <TireModelStage
        model={hydratedModel}
        variants={variants}
        modelPath={modelPath}
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
