import { notFound } from "next/navigation";
import { getAllShopCategorySlugs, getShopProducts, getShopCategoryBySlug } from "@/lib/cms";
import { createPageMetadata } from "@/lib/seo/metadata";
import { CatalogListingPage } from "@/components/catalog/CatalogListingPage";

type PageProps = {
  params: Promise<{ categorySlug: string }>;
};

export async function generateStaticParams() {
  const slugs = await getAllShopCategorySlugs();
  return slugs.map((categorySlug) => ({ categorySlug }));
}

export async function generateMetadata({ params }: PageProps) {
  const { categorySlug } = await params;
  const category = await getShopCategoryBySlug(categorySlug);
  if (!category) return {};
  return createPageMetadata({
    title: category.name,
    description: category.description,
    path: `/shop/${category.slug}`,
  });
}

export default async function ShopCategoryPage({ params }: PageProps) {
  const { categorySlug } = await params;
  const category = await getShopCategoryBySlug(categorySlug);

  if (!category) {
    notFound();
  }

  const products = await getShopProducts({ categorySlug });

  return (
    <CatalogListingPage
      title={category.name}
      description={category.description}
      breadcrumbs={[
        { href: "/", label: "Главная" },
        { href: "/shop", label: "Магазин" },
        { href: `/shop/${category.slug}`, label: category.name },
      ]}
      items={products.map((product) => ({
        key: product.slug,
        href: `/shop/product/${product.slug}`,
        title: product.name,
        description: product.descriptionShort,
        meta: product.brand,
        imageUrl: product.imageUrl,
        imageAlt: product.name,
      }))}
      emptyMessage="Товары в этой категории скоро появятся."
      footerLink={{ href: "/shop", label: "← Все категории" }}
    />
  );
}
