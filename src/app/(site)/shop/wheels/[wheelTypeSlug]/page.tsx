import { notFound } from "next/navigation";
import Link from "next/link";
import {
  getAllWheelTypeSlugs,
  getWheelModelsByTypeSlug,
  getWheelTypeBySlug,
  getWheelVariantsByTypeSlug,
} from "@/lib/content";
import { createPageMetadata } from "@/lib/seo/metadata";
import { PageHeader } from "@/components/catalog/PageHeader";
import { WheelModelGrid } from "@/components/catalog/WheelModelGrid";
import { SiteArrow } from "@/components/SiteArrow/SiteArrow";
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
  if (wheelTypeSlug.toLowerCase() === "forged") {
    return createPageMetadata({
      title: "BIZON Forged",
      description: "Пять дизайнов кованых дисков BIZON, изготавливаемых под заказ.",
      path: "/shop/wheels/forged",
    });
  }
  const loaded = await loadPublished(() => getWheelTypeBySlug(wheelTypeSlug));
  const wheelType = loaded.kind === "ok" ? loaded.value : null;
  if (!wheelType) return {};
  return createPageMetadata({
    title: wheelType.name,
    description: wheelType.description,
    path: `/shop/wheels/${wheelType.slug}`,
  });
}

export default async function WheelTypePage({ params }: PageProps) {
  const { wheelTypeSlug } = await params;
  const loaded = await loadPublished(async () => {
    const wheelType = await getWheelTypeBySlug(wheelTypeSlug);
    if (!wheelType) return null;
    if (wheelTypeSlug.toLowerCase() === "forged") {
      return { wheelType, models: await getWheelModelsByTypeSlug(wheelType.slug), variants: null };
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
  if (variants === null) return <ForgedCatalog models={models} />;

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
          <SiteArrow direction="left" /> Магазин
        </Link>
      </p>
    </div>
  );
}
