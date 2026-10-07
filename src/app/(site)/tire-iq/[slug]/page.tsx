import { notFound } from "next/navigation";

import { ArticleLayout } from "@/components/content/ArticleLayout";
import { PublishedContentUnavailable } from "@/components/content/PublishedContentUnavailable";
import { LexicalContent } from "@/components/content/LexicalContent";
import { TireIqContextualVisuals } from "@/components/content/TireIqContextualVisuals";
import { getAllTireIQSlugs, getTireIQArticleBySlug } from "@/lib/content";
import { loadPublished } from "@/lib/content/loadPublished";
import { createPageMetadata } from "@/lib/seo/metadata";
import { getTireIqArticleCover } from "@/lib/content/tireIqVisuals";

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

  return (
    <ArticleLayout
      kicker="Tire IQ"
      title={article.title}
      description={article.excerpt}
      breadcrumbs={[
        { href: "/", label: "Главная" },
        { href: "/tire-iq", label: "Tire IQ" },
        { href: `/tire-iq/${article.slug}`, label: article.title },
      ]}
      meta={article.publishedAt}
      imageUrl={article.imageUrl ?? getTireIqArticleCover(article.slug)}
      imageAlt={article.title}
      fallbackKey={article.slug}
      backHref="/tire-iq"
      backLabel="Все статьи"
    >
      <TireIqContextualVisuals slug={article.slug} />
      <LexicalContent data={article.content} fallback={article.excerpt} />
    </ArticleLayout>
  );
}
