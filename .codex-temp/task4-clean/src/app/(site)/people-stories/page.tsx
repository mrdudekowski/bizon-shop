import { createPageMetadata } from "@/lib/seo/metadata";
import { getPeopleStories } from "@/lib/cms";
import { CatalogListingPage } from "@/components/catalog/CatalogListingPage";

export const metadata = createPageMetadata({
  title: "People Stories",
  description: "Истории клиентов и fleet-операторов, работающих с BIZON.",
  path: "/people-stories",
});

export default async function PeopleStoriesPage() {
  const stories = await getPeopleStories();

  return (
    <CatalogListingPage
      title="People Stories"
      description="Реальные кейсы эксплуатации шин BIZON."
      breadcrumbs={[
        { href: "/", label: "Главная" },
        { href: "/people-stories", label: "People Stories" },
      ]}
      items={stories.map((story) => ({
        key: story.slug,
        href: `/people-stories/${story.slug}`,
        title: story.title,
        description: story.excerpt,
        meta: story.publishedAt,
        imageUrl: story.imageUrl,
        imageAlt: story.title,
      }))}
    />
  );
}
