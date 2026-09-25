import { notFound } from "next/navigation";
import Link from "next/link";
import { getAllPeopleStorySlugs, getPeopleStoryBySlug } from "@/lib/cms";
import { createPageMetadata } from "@/lib/seo/metadata";
import { LexicalContent } from "@/components/content/LexicalContent";
import { CatalogImage } from "@/components/catalog/CatalogImage";
import { PageHeader } from "@/components/catalog/PageHeader";

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

  if (!story) {
    notFound();
  }

  return (
    <div className="section-inner">
      <PageHeader
        title={story.title}
        description={story.excerpt}
        breadcrumbs={[
          { href: "/", label: "Главная" },
          { href: "/people-stories", label: "People Stories" },
          { href: `/people-stories/${story.slug}`, label: story.title },
        ]}
      />
      <div className="catalog-detail-media mb-6 max-w-3xl">
        <CatalogImage src={story.imageUrl} alt={story.title} />
      </div>
      <article className="card-base info-card max-w-3xl">
        <p className="text-sm text-muted mb-4">{story.publishedAt}</p>
        {story.clientName || story.industry ? (
          <p className="text-sm text-muted mb-4">
            {[story.clientName, story.industry].filter(Boolean).join(" · ")}
          </p>
        ) : null}
        <LexicalContent data={story.content} fallback={story.excerpt} />
      </article>
      <p className="mt-8">
        <Link href="/people-stories" className="btn-glass inline-flex">
          ← Все истории
        </Link>
      </p>
    </div>
  );
}
