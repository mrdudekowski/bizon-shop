import { notFound } from "next/navigation";
import {
  getAllWheelModelRouteParams,
  getWheelModelByTypeAndSlug,
  getWheelTypeBySlug,
  getWheelVariantsByModelId,
} from "@/lib/content";
import { createPageMetadata, textOrFallback } from "@/lib/seo/metadata";
import {
  createBreadcrumbStructuredData,
  createProductStructuredData,
  jsonLdScriptContent,
  singleVariantOffer,
  wheelModelBreadcrumbs,
} from "@/lib/seo/structuredData";
import { WheelModelStage } from "@/components/catalog/WheelModelStage";

type PageProps = {
  params: Promise<{ wheelTypeSlug: string; modelSlug: string }>;
};

export async function generateStaticParams() {
  return getAllWheelModelRouteParams();
}

export async function generateMetadata({ params }: PageProps) {
  const { wheelTypeSlug, modelSlug } = await params;
  const [wheelType, model] = await Promise.all([
    getWheelTypeBySlug(wheelTypeSlug),
    getWheelModelByTypeAndSlug(wheelTypeSlug, modelSlug),
  ]);
  if (!wheelType || !model) notFound();

  return createPageMetadata({
    title: textOrFallback(model.seoTitle, model.name),
    description: textOrFallback(model.seoDescription, textOrFallback(model.descriptionShort, model.name)),
    path: `/shop/wheels/${model.wheelTypeSlug}/${model.slug}`,
  });
}

export default async function WheelModelPage({ params }: PageProps) {
  const { wheelTypeSlug, modelSlug } = await params;
  const [wheelType, model] = await Promise.all([
    getWheelTypeBySlug(wheelTypeSlug),
    getWheelModelByTypeAndSlug(wheelTypeSlug, modelSlug),
  ]);

  if (!wheelType || !model) {
    notFound();
  }

  const modelPath = `/shop/wheels/${wheelType.slug}/${model.slug}`;
  const variants = await getWheelVariantsByModelId(model.id);
  const breadcrumbs = wheelModelBreadcrumbs({
    typeSlug: wheelType.slug,
    typeName: wheelType.name,
    modelPath,
    modelName: model.name,
  });
  const structuredData = createProductStructuredData({
    name: model.name,
    description: model.descriptionShort,
    path: modelPath,
    brand: "BIZON",
    category: wheelType.name,
    image: model.imageUrl,
    offer: singleVariantOffer(variants, model.available),
  });

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScriptContent(structuredData) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScriptContent(createBreadcrumbStructuredData(breadcrumbs)) }}
      />
      <WheelModelStage
        wheelType={wheelType}
        model={model}
        variants={variants}
        modelPath={modelPath}
      />
    </>
  );
}
