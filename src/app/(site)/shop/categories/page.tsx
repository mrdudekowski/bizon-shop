import { ShopCategoriesIndex } from "@/components/shop/ShopCategoriesIndex";
import { getShopCategories } from "@/lib/content";
import { createPageMetadata } from "@/lib/seo/metadata";

export async function generateMetadata() {
  return createPageMetadata({
    title: "Категории BIZON Shop",
    description: "Категории BIZON Shop — аксессуары, outdoor и сопутствующие товары.",
    path: "/shop/categories",
  });
}

export default async function ShopCategoriesPage() {
  const categories = await getShopCategories();
  return <ShopCategoriesIndex categories={categories} />;
}
