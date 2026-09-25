import { notFound } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import {
  getAllWheelModelRouteParams,
  getWheelModelByTypeAndSlug,
  getWheelTypeBySlug,
  getWheelVariantsByModelId,
} from "@/lib/cms";
import { getWheelConstructionMethodLabel } from "@/lib/cms/wheelConstructionMethod";
import { createPageMetadata } from "@/lib/seo/metadata";
import { createProductStructuredData } from "@/lib/seo/structuredData";
import { PageHeader } from "@/components/catalog/PageHeader";
import { WheelVariantsTable } from "@/components/catalog/WheelVariantsTable";
import { AddToCartSection } from "@/components/cart/AddToCartSection";
import { QuickOrderSection } from "@/components/forms/QuickOrderSection";
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

  const typeBasePath = `/shop/wheels/${wheelType.slug}`;
  const modelPath = `${typeBasePath}/${model.slug}`;
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
  const metaParts = [
    model.series,
    getWheelConstructionMethodLabel(model.constructionMethod),
    model.material,
    model.designStyle,
  ].filter(Boolean);

  return (
    <div className="section-inner">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <PageHeader
        title={model.name}
        description={model.descriptionShort}
        breadcrumbs={[
          { href: "/", label: "Главная" },
          { href: "/shop", label: "Магазин" },
          { href: typeBasePath, label: wheelType.name },
          { href: modelPath, label: model.name },
        ]}
      />
      {metaParts.length > 0 && (
        <p className="text-sm text-muted mb-4">{metaParts.join(" · ")}</p>
      )}
      <article className="card-base info-card max-w-3xl">
        <p className="info-card-text">{model.descriptionLong}</p>
        {model.fitmentNotes && (
          <p className="info-card-text mt-4">
            <span className="text-muted">Установка: </span>
            {model.fitmentNotes}
          </p>
        )}
      </article>

      {model.documents && model.documents.length > 0 && (
        <div className="mt-6 max-w-3xl">
          <h2 className="section-title text-lg mb-3">Документы</h2>
          <ul className="space-y-2">
            {model.documents.map((doc) => (
              <li key={doc.url}>
                <a href={doc.url} className="underline" target="_blank" rel="noopener noreferrer">
                  {doc.title}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      <WheelVariantsTable model={model} variants={variants} modelPath={modelPath} />

      <Suspense fallback={null}>
        <AddToCartSection
          baseItem={{
            itemType: "wheel",
            itemId: model.id,
            name: model.name,
            slug: model.slug,
            parentSlug: model.wheelTypeSlug,
            url: modelPath,
            quantity: 1,
            priceOnRequest: true,
          }}
          variants={variants.map((variant) => ({ id: variant.id, label: variant.sizeLabel }))}
        />
      </Suspense>

      <Suspense fallback={null}>
        <QuickOrderSection
          baseItem={{
            itemType: "wheel",
            itemId: model.id,
            name: model.name,
            slug: model.slug,
            parentSlug: model.wheelTypeSlug,
            url: modelPath,
            quantity: 1,
            priceOnRequest: true,
          }}
          variants={variants.map((variant) => ({ id: variant.id, label: variant.sizeLabel }))}
        />
      </Suspense>

      <div className="mt-8 flex flex-wrap gap-4">
        <Link href="/contact" className="btn-accent inline-flex">
          Запросить цену
        </Link>
        <Link href={typeBasePath} className="btn-glass inline-flex">
          ← Все модели {wheelType.name}
        </Link>
      </div>
    </div>
  );
}
