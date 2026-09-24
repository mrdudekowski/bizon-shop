import { EditorialListing } from "@/components/content/EditorialListing";
import { getPeopleStories } from "@/lib/content";
import { createPageMetadata } from "@/lib/seo/metadata";

export const metadata = createPageMetadata({
  title: "People Stories",
  description: "Истории эксплуатации шин BIZON в реальных автопарках.",
  path: "/people-stories",
});

export default async function PeopleStoriesPage() {
  const stories = await getPeopleStories();

  return (
    <EditorialListing
      kicker="Опыт автопарков"
      title="People Stories"
      description="Реальные сценарии эксплуатации и решения под маршрут, нагрузку и условия работы."
      breadcrumbs={[
        { href: "/", label: "Главная" },
        { href: "/people-stories", label: "People Stories" },
      ]}
      items={stories.map((story) => ({
        key: story.slug,
        href: `/people-stories/${story.slug}`,
        title: story.title,
        description: story.excerpt,
        meta: [story.clientName, story.industry].filter(Boolean).join(" · ") || story.publishedAt,
        imageUrl: story.imageUrl,
        imageAlt: story.title,
        fallbackKey: story.slug,
      }))}
      emptyMessage="Опубликованных историй пока нет."
    />
  );
}
