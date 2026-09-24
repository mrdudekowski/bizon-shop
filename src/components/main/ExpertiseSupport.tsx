import type { CmsArticle, CmsStory } from "@/lib/content/types";
import type { PageShell } from "@/lib/content/pages/types";

import { BrandingCampaign } from "./BrandingCampaign";
import { EditorialHighlights } from "./EditorialHighlights";
import styles from "./MainHome.module.css";

export function ExpertiseSupport({
  article,
  story,
  content,
}: {
  article?: CmsArticle;
  story?: CmsStory;
  content: PageShell;
}) {
  return (
    <section
      className={styles.expertise}
      data-main-chrome-tone="light"
      aria-labelledby="expertise-support-title"
    >
      <EditorialHighlights article={article} story={story} content={content} />
      <BrandingCampaign />
    </section>
  );
}
