import { ShopCategoriesIndex } from "@/components/shop/ShopCategoriesIndex";
import { PublishedContentUnavailable } from "@/components/content/PublishedContentUnavailable";
import { getShopCategories } from "@/lib/content";
import { loadPublished } from "@/lib/content/loadPublished";
import { createPageMetadata } from "@/lib/seo/metadata";

export async function generateMetadata() {
  return createPageMetadata({
    title: "Категории BIZON Shop",
    description: "Категории BIZON Shop — аксессуары, outdoor и сопутствующие товары.",
    path: "/shop/categories",
  });
}

export default async function ShopCategoriesPage() {
  const loaded = await loadPublished(getShopCategories);
  if (loaded.kind === "unavailable") return <PublishedContentUnavailable />;
  return <ShopCategoriesIndex categories={loaded.value} />;
}
