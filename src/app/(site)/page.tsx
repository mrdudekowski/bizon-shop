import { HomeContentRuntime } from "@/components/main/HomeContentRuntime";
import { getPageContent, getPublishedTireCatalog } from "@/lib/content";
import { loadPublished } from "@/lib/content/loadPublished";


export default async function HomePage() {
  const [page, catalogResult] = await Promise.all([
    getPageContent("home"),
    loadPublished(getPublishedTireCatalog),
  ]);
  const catalog = catalogResult.kind === "ok" ? catalogResult.value : null;

  return <HomeContentRuntime initialPage={page} initialCatalog={catalog} />;
}
