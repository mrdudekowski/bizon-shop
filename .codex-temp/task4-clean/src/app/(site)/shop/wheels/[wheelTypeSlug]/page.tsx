import { notFound } from "next/navigation";
import Link from "next/link";
import {
  getAllWheelTypeSlugs,
  getWheelModelsByTypeSlug,
  getWheelTypeBySlug,
  getWheelVariantsByTypeSlug,
} from "@/lib/cms";
import { createPageMetadata } from "@/lib/seo/metadata";
import { PageHeader } from "@/components/catalog/PageHeader";
import { WheelModelGrid } from "@/components/catalog/WheelModelGrid";
import { ForgedCatalog } from "@/components/shop/ForgedCatalog";

type PageProps = {
  params: Promise<{ wheelTypeSlug: string }>;
};

export async function generateStaticParams() {
  const slugs = await getAllWheelTypeSlugs();
  return [...new Set(["forged", ...slugs])].map((wheelTypeSlug) => ({ wheelTypeSlug }));
}

export async function generateMetadata({ params }: PageProps) {
  const { wheelTypeSlug } = await params;
  if (wheelTypeSlug.toLowerCase() === "forged") {
    return createPageMetadata({
      title: "BIZON Forged",
      description: "Пять дизайнов кованых дисков BIZON, изготавливаемых под заказ.",
      path: "/shop/wheels/forged",
    });
  }
  const wheelType = await getWheelTypeBySlug(wheelTypeSlug);
  if (!wheelType) return {};
  return createPageMetadata({
    title: wheelType.name,
    description: wheelType.description,
    path: `/shop/wheels/${wheelType.slug}`,
  });
}

export default async function WheelTypePage({ params }: PageProps) {
  const { wheelTypeSlug } = await params;
  if (wheelTypeSlug.toLowerCase() === "forged") {
    const wheelType = await getWheelTypeBySlug(wheelTypeSlug);
    if (!wheelType) {
      notFound();
    }
    const models = await getWheelModelsByTypeSlug(wheelType.slug);
    return <ForgedCatalog models={models} />;
  }

  const wheelType = await getWheelTypeBySlug(wheelTypeSlug);

  if (!wheelType) {
    notFound();
  }

  const [models, variants] = await Promise.all([
    getWheelModelsByTypeSlug(wheelType.slug),
    getWheelVariantsByTypeSlug(wheelType.slug),
  ]);

  const typeBasePath = `/shop/wheels/${wheelType.slug}`;

  return (
    <div className="section-inner">
      <PageHeader
        title={wheelType.name}
        description={wheelType.description}
        breadcrumbs={[
          { href: "/", label: "Главная" },
          { href: "/shop", label: "Магазин" },
          { href: typeBasePath, label: wheelType.name },
        ]}
      />
      {models.length > 0 ? (
        <WheelModelGrid models={models} variants={variants} typeBasePath={typeBasePath} />
      ) : (
        <p className="section-description">Модели этого типа скоро появятся.</p>
      )}
      <p className="mt-8">
        <Link href="/shop" className="btn-glass inline-flex">
          ← Магазин
        </Link>
      </p>
    </div>
  );
}
