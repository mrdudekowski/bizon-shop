"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { getFeatureImage } from "@/lib/catalog/featureImages";
import type { CmsTireAdvantage } from "@/lib/cms/types";
import styles from "./ModelAdvantagesCarousel.module.css";

type ModelAdvantagesCarouselProps = {
  advantages: readonly CmsTireAdvantage[];
};

export function ModelAdvantagesCarousel({ advantages }: ModelAdvantagesCarouselProps) {
  const slides = advantages;
  const [activeIndex, setActiveIndex] = useState(0);
  const [autoplay, setAutoplay] = useState(true);
  const [pageVisible, setPageVisible] = useState(true);
  const touchStartX = useRef<number | null>(null);
  const hasMultipleSlides = slides.length >= 2;

  useEffect(() => {
    const sync = () => setPageVisible(!document.hidden);
    sync();
    document.addEventListener("visibilitychange", sync);
    return () => document.removeEventListener("visibilitychange", sync);
  }, []);

  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reducedMotion.matches) {
      setAutoplay(false);
      return;
    }
    if (!autoplay || !hasMultipleSlides) return;

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

    if (!document.hidden) start();
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [autoplay, hasMultipleSlides, slides.length]);

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
    if (Math.abs(delta) < 48 || !hasMultipleSlides) return;
    selectSlide(activeIndex + (delta < 0 ? 1 : -1));
  };

  return (
    <section
      className={styles.carousel}
      aria-roledescription="carousel"
      aria-label="Преимущества модели"
      data-main-chrome-tone="dark"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {slides.map((slide, index) => {
        const image = getFeatureImage(slide.key);
        const kicker = `${String(index + 1).padStart(2, "0")} · ${image?.label ?? slide.key}`;

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
              {slide.description ? (
                <p className={styles.description}>{slide.description}</p>
              ) : null}
            </div>
          </article>
        );
      })}

      {hasMultipleSlides ? (
        <div className={styles.controls}>
          <div className={styles.progress}>
            {slides.map((slide, index) => (
              <button
                key={`${slide.key}-progress-${index}`}
                type="button"
                className={index === activeIndex ? styles.progressActive : ""}
                onClick={() => selectSlide(index)}
                aria-label={`Показать преимущество ${slide.title}`}
                aria-current={index === activeIndex ? "true" : undefined}
              >
                <span
                  className={
                    autoplay && index === activeIndex && pageVisible
                      ? styles.progressFill
                      : ""
                  }
                />
              </button>
            ))}
          </div>
          <div className={styles.arrows}>
            <button
              type="button"
              className={styles.autoplay}
              onClick={() => setAutoplay((current) => !current)}
              aria-label={autoplay ? "Приостановить карусель" : "Запустить карусель"}
            >
              {autoplay ? "Пауза" : "Старт"}
            </button>
            <button
              type="button"
              onClick={() => selectSlide(activeIndex - 1)}
              aria-label="Предыдущее преимущество"
            >
              ←
            </button>
            <button
              type="button"
              onClick={() => selectSlide(activeIndex + 1)}
              aria-label="Следующее преимущество"
            >
              →
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
