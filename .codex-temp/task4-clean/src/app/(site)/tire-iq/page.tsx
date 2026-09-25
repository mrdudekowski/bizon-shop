import { createPageMetadata } from "@/lib/seo/metadata";
import { getTireIQArticles } from "@/lib/cms";
import { CatalogListingPage } from "@/components/catalog/CatalogListingPage";

export const metadata = createPageMetadata({
  title: "Tire IQ",
  description: "Экспертные материалы о подборе и эксплуатации большегрузной резины.",
  path: "/tire-iq",
});

export default async function TireIQPage() {
  const articles = await getTireIQArticles();

  return (
    <CatalogListingPage
      title="Tire IQ"
      description="Статьи и гайды для fleet-операторов и механиков."
      breadcrumbs={[{ href: "/", label: "Главная" }, { href: "/tire-iq", label: "Tire IQ" }]}
      items={articles.map((article) => ({
        key: article.slug,
        href: `/tire-iq/${article.slug}`,
        title: article.title,
        description: article.excerpt,
        meta: article.publishedAt,
        imageUrl: article.imageUrl,
        imageAlt: article.title,
      }))}
    />
  );
}
