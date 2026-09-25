### Task 3: `ModelAdvantagesCarousel` component

**Files:**
- Create: `src/components/catalog/ModelAdvantagesCarousel.tsx`
- Create: `src/components/catalog/ModelAdvantagesCarousel.module.css`

**Interfaces:**
- Consumes: `CmsTireAdvantage[]`, `getFeatureImage(key)`
- Produces: `<ModelAdvantagesCarousel advantages={CmsTireAdvantage[]} />` (client component)
- Behavior contract (mirror shop):
  - Autoplay 7000ms when `advantages.length >= 2` and not reduced-motion
  - Pause on `document.hidden`
  - Manual select / arrow / swipe в†’ `setAutoplay(false)`
  - Swipe threshold 48px
  - Single slide: render media+text, omit controls block (or render without autoplay buttons)

- [ ] **Step 1: Add CSS module**

Create `src/components/catalog/ModelAdvantagesCarousel.module.css` adapted from `ShopCategoryCarousel.module.css`:

- `.carousel`: `position: relative`, `min-height: clamp(620px, 86vh, 920px)`, `overflow: hidden`, `background: var(--bizon-black)`, `color: var(--bizon-white)`, `touch-action: pan-y`, `width: 100%`, `max-width: 100%`, `min-width: 0`
- `.slide` / `.slideActive`: absolute fade (720ms)
- `.media img`: `object-fit: cover`; absolute inset media
- `.overlay`: shop-like dual gradient
- `.content`: grid, container width `min(var(--container-max), calc(100% - (var(--page-gutter) * 2)))`, centered, `align-content: center`, gap; kicker uppercase; `h2` large clamp; description muted rgba white
- `.controls` / `.progress` / `.progressFill` / `.arrows` / `.autoplay`: copy shop patterns; animation `advantages-progress 7s linear forwards`
- Mobile `max-width: 639px`: taller min-height, content `align-content: end` + bottom padding for controls
- `prefers-reduced-motion`: no slide transition / no progress animation

Do **not** style a slide CTA link (none exists).

- [ ] **Step 2: Implement client carousel**

Create `src/components/catalog/ModelAdvantagesCarousel.tsx`:

```tsx
"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import type { CmsTireAdvantage } from "@/lib/cms/types";
import { getFeatureImage } from "@/lib/catalog/featureImages";
import styles from "./ModelAdvantagesCarousel.module.css";

type ModelAdvantagesCarouselProps = {
  advantages: readonly CmsTireAdvantage[];
};

export function ModelAdvantagesCarousel({ advantages }: ModelAdvantagesCarouselProps) {
  const slides = advantages;
  const [activeIndex, setActiveIndex] = useState(0);
  const [autoplay, setAutoplay] = useState(true);
  const touchStartX = useRef<number | null>(null);
  const multi = slides.length >= 2;

  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reducedMotion.matches) {
      setAutoplay(false);
      return;
    }
    if (!autoplay || !multi) return;

    let timer: number | undefined;
    const start = () => {
      window.clearInterval(timer);
      timer = window.setInterval(() => {
        setActiveIndex((current) => (current + 1) % slides.length);
      }, 7000);
    };
    const onVisibilityChange = () => {
      if (document.hidden) window.clearInterval(timer);
      else start();
    };

    start();
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [autoplay, multi, slides.length]);

  const selectSlide = (index: number) => {
    setAutoplay(false);
    setActiveIndex((index + slides.length) % slides.length);
  };

  const onTouchStart = (event: React.TouchEvent<HTMLElement>) => {
    touchStartX.current = event.touches[0]?.clientX ?? null;
  };

  const onTouchEnd = (event: React.TouchEvent<HTMLElement>) => {
    if (touchStartX.current === null) return;
    const delta = (event.changedTouches[0]?.clientX ?? touchStartX.current) - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(delta) < 48 || !multi) return;
    selectSlide(activeIndex + (delta < 0 ? 1 : -1));
  };

  return (
    <section
      className={styles.carousel}
      aria-roledescription="carousel"
      aria-label="РџСЂРµРёРјСѓС‰РµСЃС‚РІР° РјРѕРґРµР»Рё"
      data-main-chrome-tone="dark"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {slides.map((slide, index) => {
        const image = getFeatureImage(slide.key);
        const kicker = `${String(index + 1).padStart(2, "0")} В· ${image?.label ?? slide.key}`;
        return (
          <article
            key={`${slide.key}-${index}`}
            className={`${styles.slide} ${index === activeIndex ? styles.slideActive : ""}`}
            aria-hidden={index !== activeIndex}
          >
            {image ? (
              <div className={styles.media}>
                <Image
                  src={image.src}
                  alt={image.alt}
                  fill
                  sizes="100vw"
                  priority={index === 0}
                />
              </div>
            ) : (
              <div className={styles.mediaFallback} aria-hidden="true" />
            )}
            <div className={styles.overlay} aria-hidden="true" />
            <div className={styles.content}>
              <p>{kicker}</p>
              <h2>{slide.title}</h2>
              {slide.description ? <p className={styles.description}>{slide.description}</p> : null}
            </div>
          </article>
        );
      })}

      {multi ? (
        <div className={styles.controls}>
          <div className={styles.progress}>
            {slides.map((slide, index) => (
              <button
                key={`${slide.key}-progress-${index}`}
                type="button"
                className={index === activeIndex ? styles.progressActive : ""}
                onClick={() => selectSlide(index)}
                aria-label={`РџРѕРєР°Р·Р°С‚СЊ РїСЂРµРёРјСѓС‰РµСЃС‚РІРѕ ${slide.title}`}
                aria-current={index === activeIndex ? "true" : undefined}
              >
                <span className={autoplay && index === activeIndex ? styles.progressFill : ""} />
              </button>
            ))}
          </div>
          <div className={styles.arrows}>
            <button
              type="button"
              className={styles.autoplay}
              onClick={() => setAutoplay((current) => !current)}
              aria-label={autoplay ? "РџСЂРёРѕСЃС‚Р°РЅРѕРІРёС‚СЊ РєР°СЂСѓСЃРµР»СЊ" : "Р—Р°РїСѓСЃС‚РёС‚СЊ РєР°СЂСѓСЃРµР»СЊ"}
            >
              {autoplay ? "РџР°СѓР·Р°" : "РЎС‚Р°СЂС‚"}
            </button>
            <button type="button" onClick={() => selectSlide(activeIndex - 1)} aria-label="РџСЂРµРґС‹РґСѓС‰РµРµ РїСЂРµРёРјСѓС‰РµСЃС‚РІРѕ">
              в†ђ
            </button>
            <button type="button" onClick={() => selectSlide(activeIndex + 1)} aria-label="РЎР»РµРґСѓСЋС‰РµРµ РїСЂРµРёРјСѓС‰РµСЃС‚РІРѕ">
              в†’
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
```

CSS must include `.media` (positioned), `.mediaFallback` (solid dark), `.description` (readable secondary text). Content kickers: first `p` in `.content` is uppercase kicker; `.description` is separate class so it is not styled like the kicker.

- [ ] **Step 3: Typecheck**

```bash
npx tsc --noEmit
```

Expected: exit 0 (component unused yet is fine)

- [ ] **Step 4: Commit (only if user asked)**

```bash
git add src/components/catalog/ModelAdvantagesCarousel.tsx src/components/catalog/ModelAdvantagesCarousel.module.css
git commit -m "$(cat <<'EOF'
Add model advantages full-bleed carousel component.

EOF
)"
```

---

