import { Suspense } from "react";
import { EditorialListing } from "@/components/content/EditorialListing";
import { PublishedContentUnavailable } from "@/components/content/PublishedContentUnavailable";
import { TireIqApplicationGuide } from "@/components/content/TireIqApplicationGuide";
import { TireIqAxleSelector } from "@/components/content/TireIqAxleSelector";
import { TireIqDumpTruckSelector } from "@/components/content/TireIqDumpTruckSelector";
import { TireIqBusSelector } from "@/components/content/TireIqBusSelector";
import { TireIqJobNav } from "@/components/content/TireIqJobNav";
import { getTireIQArticles } from "@/lib/content";
import { loadPublished } from "@/lib/content/loadPublished";
import { TIRE_IQ_JOBS } from "@/lib/content/tireIqJobs";
import { getTireIqArticleCover } from "@/lib/content/tireIqVisuals";
import { createPageMetadata } from "@/lib/seo/metadata";

export const metadata = createPageMetadata({
  title: "Tire IQ",
  description: "Экспертные материалы о подборе и эксплуатации большегрузной резины.",
  path: "/tire-iq",
});

export default async function TireIQPage() {
  const loaded = await loadPublished(() => getTireIQArticles());
  if (loaded.kind === "unavailable") {
    return (
      <PublishedContentUnavailable
        title="Материалы Tire IQ временно недоступны"
        message="Не получилось загрузить статьи. Попробуйте ещё раз через минуту."
      />
    );
  }
  const articles = loaded.value;
  const hasKnowledge = articles.length > 0;

  return (
    <Suspense fallback={null}><EditorialListing
      kicker="Инженерные решения для подбора и эксплуатации"
      title="Tire IQ"
      description="Методики подбора, диагностики и эксплуатации шин для fleet-операторов и технических специалистов."
      breadcrumbs={[
        { href: "/", label: "Главная" },
        { href: "/tire-iq", label: "Tire IQ" },
      ]}
      beforeContent={
        <>
          <TireIqJobNav jobs={TIRE_IQ_JOBS} hasKnowledge={hasKnowledge} />
          <TireIqApplicationGuide hasKnowledge={hasKnowledge} />
          <TireIqAxleSelector hasKnowledge={hasKnowledge} />
          <TireIqDumpTruckSelector hasKnowledge={hasKnowledge} />
          <TireIqBusSelector hasKnowledge={hasKnowledge} />
        </>
      }
      items={articles.map((article) => ({
        key: article.slug,
        href: `/tire-iq/${article.slug}`,
        title: article.title,
        description: article.excerpt,
        meta: article.publishedAt,
        taxonomy: article.taxonomy,
        imageUrl: article.imageUrl ?? getTireIqArticleCover(article.slug),
        imageAlt: article.title,
        fallbackKey: article.slug,
      }))}
      emptyMessage="Опубликованных статей Tire IQ пока нет."
    /></Suspense>
  );
}
