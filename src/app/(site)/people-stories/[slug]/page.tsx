import { notFound } from "next/navigation";

import { ArticleLayout } from "@/components/content/ArticleLayout";
import { LexicalContent } from "@/components/content/LexicalContent";
import { getAllPeopleStorySlugs, getPeopleStoryBySlug } from "@/lib/content";
import { createPageMetadata } from "@/lib/seo/metadata";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  const slugs = await getAllPeopleStorySlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const story = await getPeopleStoryBySlug(slug);
  if (!story) return {};
  return createPageMetadata({
    title: story.title,
    description: story.excerpt,
    path: `/people-stories/${story.slug}`,
  });
}

export default async function PeopleStoryPage({ params }: PageProps) {
  const { slug } = await params;
  const story = await getPeopleStoryBySlug(slug);
  if (!story) notFound();

  const aside = [story.clientName, story.industry].filter(Boolean).join(" · ");

  return (
    <ArticleLayout
      kicker="People Stories"
      title={story.title}
      description={story.excerpt}
      breadcrumbs={[
        { href: "/", label: "Главная" },
        { href: "/people-stories", label: "People Stories" },
        { href: `/people-stories/${story.slug}`, label: story.title },
      ]}
      meta={story.publishedAt}
      aside={aside ? <p>{aside}</p> : null}
      imageUrl={story.imageUrl}
      imageAlt={story.title}
      fallbackKey={story.slug}
      backHref="/people-stories"
      backLabel="Все истории"
    >
      <LexicalContent data={story.content} fallback={story.excerpt} />
    </ArticleLayout>
  );
}
