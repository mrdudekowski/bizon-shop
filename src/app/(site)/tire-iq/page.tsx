import { TireIqListingRuntime } from "@/components/content/TireIqListingRuntime";
import { PublishedContentUnavailable } from "@/components/content/PublishedContentUnavailable";
import { TireIqPrimaryActions } from "@/components/content/TireIqPrimaryActions";
import { getTireIQArticles } from "@/lib/content";
import { loadPublished } from "@/lib/content/loadPublished";
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
  return <TireIqListingRuntime
    articles={articles}
    beforeContent={<TireIqPrimaryActions hasKnowledge={articles.length > 0} />}
  />;
}
