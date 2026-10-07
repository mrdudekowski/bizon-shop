import Image from "next/image";

import type { HomeHeroContent } from "@/lib/content/pages/types";

import styles from "./MainHome.module.css";

function accentHeroTitle(title: string) {
  const text = title.replaceAll("ваших", "больших");
  const accent = "больших";
  const at = text.indexOf(accent);
  if (at < 0) return text;
  return (
    <>
      {text.slice(0, at)}
      <span className={styles.heroAccent}>{accent}</span>
      {text.slice(at + accent.length)}
    </>
  );
}

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
          <h1>{accentHeroTitle(content.title)}</h1>
          <p>{content.lead}</p>
        </div>
      </div>
    </section>
  );
}
