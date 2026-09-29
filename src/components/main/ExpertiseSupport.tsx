import type { PageShell } from "@/lib/content/pages/types";

import { EditorialHighlights } from "./EditorialHighlights";
import { HOME_SHOP_ZONE_EXIT_ID } from "./homeShopZone";
import styles from "./MainHome.module.css";

export function ExpertiseSupport({ content }: { content: PageShell }) {
  return (
    <section
      id={HOME_SHOP_ZONE_EXIT_ID}
      className={styles.expertise}
      data-main-chrome-tone="light"
      aria-labelledby="expertise-support-title"
    >
      <EditorialHighlights content={content} />
    </section>
  );
}
