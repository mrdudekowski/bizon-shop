import { HomeContentRuntime } from "@/components/main/HomeContentRuntime";
import { getPageContent, getPublishedTireCatalog } from "@/lib/content";
import { loadPublished } from "@/lib/content/loadPublished";


export default async function HomePage() {
  const [page, shopHome, catalogResult] = await Promise.all([
    getPageContent("home"),
    getPageContent("shop-home"),
    loadPublished(getPublishedTireCatalog),
  ]);
  const catalog = catalogResult.kind === "ok" ? catalogResult.value : null;

  return <HomeContentRuntime initialPage={page} initialShopHome={shopHome} initialCatalog={catalog} />;
}
