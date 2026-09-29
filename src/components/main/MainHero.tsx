import Image from "next/image";

import type { HeroModelSlide } from "@/lib/catalog/heroTireSlides";
import type { HomeHeroContent } from "@/lib/content/pages/types";

import styles from "./MainHome.module.css";

export type { HeroModelSlide };

export function MainHero({
  content,
  slides,
}: {
  content: HomeHeroContent;
  slides: HeroModelSlide[];
}) {
  const tires = slides.filter((slide) => slide.imageUrl);

  return (
    <section
      className={styles.hero}
      data-main-chrome-tone="dark"
      aria-label={tires.length > 0 ? "Модели TBR" : undefined}
    >
      <div className={styles.heroMedia}>
        {content.imageUrl ? (
          <Image
            src={
              content.imageUrl.startsWith("/")
                ? `${content.imageUrl}?v=hd`
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

      {tires.length > 0 ? (
        <div className={styles.heroTires}>
          {tires.map((slide) => (
            <a key={slide.id} className={styles.heroTire} href={slide.href}>
              <span className={styles.heroTireCaption}>
                <strong>{slide.name}</strong>
                <span>{slide.axleLabel}</span>
              </span>
              <span className={styles.heroTireMedia}>
                <Image
                  src={`${slide.imageUrl}?v=crop`}
                  alt=""
                  fill
                  unoptimized
                  sizes="(max-width: 767px) 32vw, 15vw"
                  style={{ objectFit: "contain", objectPosition: "center bottom" }}
                />
              </span>
            </a>
          ))}
        </div>
      ) : null}

      <div className={styles.inner}>
        <div className={styles.heroCopy}>
          <h1>{content.title}</h1>
          <p>{content.lead}</p>
        </div>
      </div>
    </section>
  );
}
