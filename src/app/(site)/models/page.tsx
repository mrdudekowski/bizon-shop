import { TireCatalogIndexRuntime } from "@/components/catalog/TireCatalogIndexRuntime";
import { PublishedContentUnavailable } from "@/components/content/PublishedContentUnavailable";
import { getPublishedTireCatalog } from "@/lib/content";
import { loadPublished } from "@/lib/content/loadPublished";
import { createPageMetadata } from "@/lib/seo/metadata";

export const metadata = createPageMetadata({
  title: "Модели",
  description: "Категории и модели большегрузной резины BIZON.",
  path: "/models",
});

export default async function ModelsPage() {
  const loaded = await loadPublished(getPublishedTireCatalog);
  if (loaded.kind === "unavailable") {
    return (
      <PublishedContentUnavailable
        title="Каталог шин временно недоступен"
        message="Не получилось загрузить каталог. Попробуйте ещё раз через минуту."
      />
    );
  }
  return <TireCatalogIndexRuntime initialCatalog={loaded.value} />;
}
