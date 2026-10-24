import { notFound } from "next/navigation";

import { TireIqArticleRuntime } from "@/components/content/TireIqArticleRuntime";
import { PublishedContentUnavailable } from "@/components/content/PublishedContentUnavailable";
import { getAllTireIQSlugs, getTireIQArticleBySlug } from "@/lib/content";
import { loadPublished } from "@/lib/content/loadPublished";
import { createPageMetadata } from "@/lib/seo/metadata";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  const loaded = await loadPublished(getAllTireIQSlugs);
  const slugs = loaded.kind === "ok" ? loaded.value : [];
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const loaded = await loadPublished(() => getTireIQArticleBySlug(slug));
  if (loaded.kind === "unavailable") return {};
  const article = loaded.value;
  if (!article) return {};
  return createPageMetadata({
    title: article.title,
    description: article.excerpt,
    path: `/tire-iq/${article.slug}`,
  });
}

export default async function TireIQArticlePage({ params }: PageProps) {
  const { slug } = await params;
  const loaded = await loadPublished(() => getTireIQArticleBySlug(slug));
  if (loaded.kind === "unavailable") {
    return (
      <PublishedContentUnavailable
        title="Материал Tire IQ временно недоступен"
        message="Не получилось загрузить статью. Попробуйте ещё раз через минуту."
      />
    );
  }
  const article = loaded.value;
  if (!article) notFound();

  return <TireIqArticleRuntime article={article} />;
}
