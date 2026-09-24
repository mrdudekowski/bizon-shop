import { notFound } from "next/navigation";
import { getAllShopCategorySlugs, getShopProducts, getShopCategoryBySlug } from "@/lib/content";
import { createPageMetadata } from "@/lib/seo/metadata";
import { ShopLifestyleCategoryPage } from "@/components/shop/ShopLifestyleCategory";
import { ShopProductCatalog } from "@/components/shop/ShopProductCatalog";
import {
  getShopLifestyleCategory,
  SHOP_LIFESTYLE_CATEGORIES,
} from "@/constants/shopCategories";

type PageProps = {
  params: Promise<{ categorySlug: string }>;
};

export async function generateStaticParams() {
  const slugs = await getAllShopCategorySlugs();
  return Array.from(new Set([
    ...SHOP_LIFESTYLE_CATEGORIES.map((category) => category.slug),
    ...slugs,
  ])).map((categorySlug) => ({ categorySlug }));
}

export async function generateMetadata({ params }: PageProps) {
  const { categorySlug } = await params;
  const lifestyleCategory = getShopLifestyleCategory(categorySlug);
  if (lifestyleCategory) {
    return createPageMetadata({
      title: lifestyleCategory.kicker,
      description: lifestyleCategory.description,
      path: `/shop/${lifestyleCategory.slug}`,
    });
  }

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
  const lifestyleCategory = getShopLifestyleCategory(categorySlug);

  if (lifestyleCategory) {
    const products = await getShopProducts({ categorySlug });
    return <ShopLifestyleCategoryPage category={lifestyleCategory} products={products} />;
  }

  const category = await getShopCategoryBySlug(categorySlug);

  if (!category) {
    notFound();
  }

  const products = await getShopProducts({ categorySlug });

  return (
    <ShopProductCatalog category={category} products={products} />
  );
}
