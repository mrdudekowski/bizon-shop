import Image from "next/image";

import type { HomeHeroContent } from "@/lib/content/pages/types";

import styles from "./MainHome.module.css";

export function MainHero({ content }: { content: HomeHeroContent }) {
  return (
    <section className={styles.hero} data-main-chrome-tone="dark">
      <div className={styles.heroMedia}>
        {content.imageUrl ? (
          <Image
            src={
              content.imageUrl.startsWith("/")
                ? `${content.imageUrl}?v=otr`
                : content.imageUrl
            }
            alt={content.imageAlt}
            fill
            priority
            sizes="100vw"
          />
        ) : null}
      </div>

      <div className={styles.heroOverlay} aria-hidden="true" />

      <div className={styles.inner}>
        <div className={styles.heroCopy}>
          {content.eyebrow ? <p className={styles.eyebrow}>{content.eyebrow}</p> : null}
          <h1>{content.title}</h1>
          <p>{content.lead}</p>
        </div>
      </div>
    </section>
  );
}
