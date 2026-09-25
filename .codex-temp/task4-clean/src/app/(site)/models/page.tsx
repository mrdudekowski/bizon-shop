import { createPageMetadata } from "@/lib/seo/metadata";
import { getTireTypes } from "@/lib/cms";
import { CatalogListingPage } from "@/components/catalog/CatalogListingPage";

export const metadata = createPageMetadata({
  title: "Модели",
  description: "Категории и модели большегрузной резины BIZON.",
  path: "/models",
});

export default async function ModelsPage() {
  const tireTypes = await getTireTypes();

  return (
    <CatalogListingPage
      title="Модели"
      description="Категории шин для магистралей, карьеров и спецтехники."
      breadcrumbs={[{ href: "/", label: "Главная" }, { href: "/models", label: "Модели" }]}
      items={tireTypes.map((type) => ({
        key: type.slug,
        href: `/models/${type.slug}`,
        title: type.name,
        description: type.shortDescription,
        imageUrl: type.imageUrl,
        imageAlt: type.name,
      }))}
    />
  );
}
