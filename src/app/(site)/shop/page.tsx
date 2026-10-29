import { PublishedContentUnavailable } from "@/components/content/PublishedContentUnavailable";
import { getPageContent, getShopCategories, getWheelModelsByTypeSlug } from "@/lib/content";
import { getPublishedStubOverlay } from "@/lib/content/getPageContent";
import { loadPublished } from "@/lib/content/loadPublished";
import { createPageMetadata } from "@/lib/seo/metadata";
import { ShopHomeClient } from "./ShopHomeClient";

export async function generateMetadata() {
  const page = await getPageContent("shop-home");
  return createPageMetadata({
    title: page.seoTitle ?? "BIZON Shop",
    description: page.seoDescription ?? "Кованые диски BIZON под заказ, аксессуары и outdoor-товары.",
    path: "/shop",
  });
}

export default async function ShopPage() {
  const loaded = await loadPublished(() => Promise.all([
    getPageContent("shop-home"),
    getWheelModelsByTypeSlug("forged"),
    getShopCategories(),
    getPublishedStubOverlay("contact"),
  ]));
  if (loaded.kind === "unavailable") return <PublishedContentUnavailable />;

  const [initialPage, initialModels, initialCategories, contactPage] = loaded.value;
  return (
    <ShopHomeClient
      initialPage={initialPage}
      initialModels={initialModels}
      initialCategories={initialCategories}
      madeToOrderNotice={contactPage?.siteProfile?.madeToOrderNotice ?? ""}
    />
  );
}
