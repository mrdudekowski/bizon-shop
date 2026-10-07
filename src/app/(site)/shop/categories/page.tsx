import { ShopCategoriesIndex } from "@/components/shop/ShopCategoriesIndex";
import { PublishedContentUnavailable } from "@/components/content/PublishedContentUnavailable";
import { getPageContent, getShopCategories } from "@/lib/content";
import { loadPublished } from "@/lib/content/loadPublished";
import { createPageMetadata } from "@/lib/seo/metadata";

export async function generateMetadata() {
  const page = await getPageContent("shop-home");
  return createPageMetadata({
    title: page.catalog.copy.title || "Категории BIZON Shop",
    description: page.catalog.copy.lead || "Категории BIZON Shop — аксессуары, outdoor и сопутствующие товары.",
    path: "/shop/categories",
  });
}

export default async function ShopCategoriesPage() {
  const loaded = await loadPublished(() => Promise.all([
    getPageContent("shop-home"),
    getShopCategories(),
  ]));
  if (loaded.kind === "unavailable") return <PublishedContentUnavailable />;
  const [page, categories] = loaded.value;
  return <ShopCategoriesIndex categories={categories} catalog={page.catalog} />;
}
