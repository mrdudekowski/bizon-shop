"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import type { HeroModelSlide } from "@/lib/catalog/heroTireSlides";
import type { HomeHeroContent } from "@/lib/content/pages/types";

import styles from "./MainHome.module.css";

export type { HeroModelSlide };

const AUTOPLAY_MS = 7000;

export function MainHero({
  content,
  slides,
}: {
  content: HomeHeroContent;
  slides: HeroModelSlide[];
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [autoplay, setAutoplay] = useState(true);
  const touchStartX = useRef<number | null>(null);
  const active = slides[activeIndex] ?? slides[0];

  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reducedMotion.matches) {
      setAutoplay(false);
      return;
    }

    if (!autoplay || slides.length < 2) return;

    let timer: number | undefined;
    const start = () => {
      window.clearInterval(timer);
      timer = window.setInterval(() => {
        setActiveIndex((current) => (current + 1) % slides.length);
      }, AUTOPLAY_MS);
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
  }, [autoplay, slides.length]);

  const selectSlide = (index: number) => {
    setAutoplay(false);
    setActiveIndex((index + slides.length) % slides.length);
  };

  const onTouchStart = (event: React.TouchEvent<HTMLElement>) => {
    touchStartX.current = event.touches[0]?.clientX ?? null;
  };

  const onTouchEnd = (event: React.TouchEvent<HTMLElement>) => {
    if (touchStartX.current === null) return;
    const delta =
      (event.changedTouches[0]?.clientX ?? touchStartX.current) - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(delta) < 48) return;
    selectSlide(activeIndex + (delta < 0 ? 1 : -1));
  };

  return (
    <section
      className={styles.hero}
      data-main-chrome-tone="dark"
      aria-roledescription={slides.length > 1 ? "carousel" : undefined}
      aria-label={slides.length > 0 ? "Модели TBR" : undefined}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <div className={styles.heroMedia}>
        {content.imageUrl ? (
          <Image
            src={content.imageUrl}
            alt={content.imageAlt}
            fill
            priority
            sizes="100vw"
          />
        ) : null}
      </div>

      <div className={styles.heroOverlay} aria-hidden="true" />

      {slides.length > 0 ? (
        <div className={styles.heroTires} aria-hidden="true">
          {slides.map((slide, index) => (
            <div
              key={slide.id}
              className={styles.heroTire}
            >
              {slide.imageUrl ? (
                <div className={`${styles.heroTireFrame} ${index === activeIndex ? styles.heroTireFrameOn : ""}`}>
                  <Image
                    src={slide.imageUrl}
                    alt=""
                    fill
                    unoptimized
                    sizes="(max-width: 767px) 88vw, 52vw"
                    style={{ objectFit: "contain", objectPosition: "right center" }}
                  />
                </div>
              ) : null}
            </div>
          ))}
        </div>
      ) : null}

      {active ? (
        <Link
          className={styles.heroHit}
          href={active.href}
          aria-label={`Открыть модель ${active.name}`}
        />
      ) : null}

      <div className={styles.inner}>
        <div className={styles.heroCopy}>
          <p className={styles.eyebrow}>{content.eyebrow}</p>
          <h1>{content.title}</h1>
          <p>{content.lead}</p>
        </div>

        {slides.length > 1 && active ? (
          <div className={styles.heroControls}>
            <p className={styles.heroModelCue} aria-live="polite">
              {active.name}
            </p>
            <div className={styles.heroProgress}>
              {slides.map((slide, index) => (
                <button
                  key={slide.id}
                  type="button"
                  className={index === activeIndex ? styles.heroProgressActive : undefined}
                  onClick={() => selectSlide(index)}
                  aria-label={`Показать ${slide.name}`}
                  aria-current={index === activeIndex ? "true" : undefined}
                >
                  <span
                    className={
                      autoplay && index === activeIndex ? styles.heroProgressFill : undefined
                    }
                  />
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
