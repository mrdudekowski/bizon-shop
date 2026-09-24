import { notFound } from "next/navigation";
import {
  getAllWheelModelRouteParams,
  getWheelModelByTypeAndSlug,
  getWheelTypeBySlug,
  getWheelVariantsByModelId,
} from "@/lib/content";
import { createPageMetadata } from "@/lib/seo/metadata";
import { createProductStructuredData } from "@/lib/seo/structuredData";
import { WheelModelStage } from "@/components/catalog/WheelModelStage";
import { ForgedModel } from "@/components/shop/ForgedModel";
import { toForgedWheelView } from "@/components/shop/forgedView";

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
    title: model.name,
    description: model.descriptionShort,
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
  const structuredData = createProductStructuredData({
    name: model.name,
    description: model.descriptionShort,
    path: modelPath,
    brand: model.series ?? "BIZON",
    category: wheelType.name,
  });

  if (wheelType.slug === "forged") {
    const view = toForgedWheelView(model);
    if (!view) notFound();

    return (
      <>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
        <ForgedModel model={view} />
      </>
    );
  }

  const variants = await getWheelVariantsByModelId(model.id);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
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
