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
  const mediaSlides =
    slides.length > 0
      ? slides
      : [
          {
            id: "fallback",
            name: content.title,
            href: content.secondaryCta.href,
            imageUrl: content.imageUrl,
            imageAlt: content.imageAlt,
          },
        ];

  const [activeIndex, setActiveIndex] = useState(0);
  const [autoplay, setAutoplay] = useState(true);
  const touchStartX = useRef<number | null>(null);
  const active = mediaSlides[activeIndex] ?? mediaSlides[0];

  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reducedMotion.matches) {
      setAutoplay(false);
      return;
    }

    if (!autoplay || mediaSlides.length < 2) return;

    let timer: number | undefined;
    const start = () => {
      window.clearInterval(timer);
      timer = window.setInterval(() => {
        setActiveIndex((current) => (current + 1) % mediaSlides.length);
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
  }, [autoplay, mediaSlides.length]);

  const selectSlide = (index: number) => {
    setAutoplay(false);
    setActiveIndex((index + mediaSlides.length) % mediaSlides.length);
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
      aria-roledescription="carousel"
      aria-label="Модели TBR"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <div className={styles.heroMedia}>
        {mediaSlides.map((slide, index) => (
          <div
            key={slide.id}
            className={`${styles.heroSlide} ${index === activeIndex ? styles.heroSlideActive : ""}`}
            aria-hidden={index !== activeIndex}
          >
            <Image
              src={slide.imageUrl}
              alt={slide.imageAlt}
              fill
              priority={index === 0}
              sizes="100vw"
            />
          </div>
        ))}
      </div>

      <div className={styles.heroOverlay} aria-hidden="true" />

      <Link
        className={styles.heroHit}
        href={active.href}
        aria-label={`Открыть модель ${active.name}`}
      />

      <div className={styles.inner}>
        <div className={styles.heroCopy}>
          <p className={styles.eyebrow}>{content.eyebrow}</p>
          <h1>{content.title}</h1>
          <p>{content.lead}</p>
        </div>

        {mediaSlides.length > 1 ? (
          <div className={styles.heroControls}>
            <p className={styles.heroModelCue} aria-live="polite">
              {active.name}
            </p>
            <div className={styles.heroProgress}>
              {mediaSlides.map((slide, index) => (
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
