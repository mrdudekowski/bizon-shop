"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { SiteArrow } from "@/components/SiteArrow/SiteArrow";
import styles from "@/components/catalog/ModelAdvantagesCarousel.module.css";
import type { ShopHomeCarouselSlide } from "@/lib/content/shopCategoryPresentation";

export function ShopCategoryCarousel({ slides }: { slides: readonly ShopHomeCarouselSlide[] }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [autoplay, setAutoplay] = useState(true);
  const [pageVisible, setPageVisible] = useState(true);
  const touchStartX = useRef<number | null>(null);
  const count = slides.length;
  const hasMultipleSlides = count >= 2;

  useEffect(() => {
    setActiveIndex(0);
  }, [count]);

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
        setActiveIndex((current) => (current + 1) % count);
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
  }, [autoplay, hasMultipleSlides, count]);

  if (count === 0) return null;

  function selectSlide(index: number) {
    setAutoplay(false);
    setActiveIndex((index + count) % count);
  }

  function onTouchStart(event: React.TouchEvent<HTMLElement>) {
    touchStartX.current = event.touches[0]?.clientX ?? null;
  }

  function onTouchEnd(event: React.TouchEvent<HTMLElement>) {
    if (touchStartX.current == null) return;
    const delta = (event.changedTouches[0]?.clientX ?? touchStartX.current) - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(delta) < 48 || !hasMultipleSlides) return;
    selectSlide(activeIndex + (delta < 0 ? 1 : -1));
  }

  return (
    <div
      className={styles.carousel}
      role="region"
      aria-roledescription="carousel"
      aria-label="Категории BIZON Shop"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {slides.map((slide, index) => (
        <article
          key={slide.id}
          className={`${styles.slide} ${index === activeIndex ? styles.slideActive : ""}`}
          aria-hidden={index !== activeIndex}
        >
          {slide.imageUrl ? (
            <div className={styles.media}>
              <Image src={slide.imageUrl} alt="" fill sizes="100vw" priority={index === 0} />
            </div>
          ) : (
            <div className={styles.mediaFallback} aria-hidden="true" />
          )}
          <div className={styles.overlay} aria-hidden="true" />
          <div className={styles.content}>
            <h3 className={styles.title}>
              <Link href={slide.href}>{slide.title}</Link>
            </h3>
          </div>
        </article>
      ))}

      {hasMultipleSlides ? (
        <div className={styles.controls}>
          <div className={styles.progress}>
            {slides.map((slide, index) => (
              <button
                key={`${slide.id}-progress`}
                type="button"
                className={index === activeIndex ? styles.progressActive : ""}
                onClick={() => selectSlide(index)}
                aria-label={`Показать ${slide.title}`}
                aria-current={index === activeIndex ? "true" : undefined}
              >
                <span
                  className={
                    autoplay && index === activeIndex && pageVisible ? styles.progressFill : ""
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
            <button type="button" onClick={() => selectSlide(activeIndex - 1)} aria-label="Предыдущий кадр">
              <SiteArrow direction="left" />
            </button>
            <button type="button" onClick={() => selectSlide(activeIndex + 1)} aria-label="Следующий кадр">
              <SiteArrow />
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
