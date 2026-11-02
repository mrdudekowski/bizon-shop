"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { SiteArrow } from "@/components/SiteArrow/SiteArrow";
import { carouselSwipeStep } from "@/components/catalog/carouselSwipe";
import styles from "@/components/catalog/ModelAdvantagesCarousel.module.css";
import mobileStyles from "./ShopCategoryCarousel.module.css";
import type { ShopHomeCarouselSlide } from "@/lib/content/shopCategoryPresentation";

export function ShopCategoryCarousel({
  slides,
  showSlideTitle = true,
  children,
}: {
  slides: readonly ShopHomeCarouselSlide[];
  showSlideTitle?: boolean;
  children?: ReactNode;
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [autoplay, setAutoplay] = useState(true);
  const [pageVisible, setPageVisible] = useState(true);
  const touchStart = useRef<{ x: number; y: number } | null>(null);
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

  if (count === 0) {
    if (!children) return null;
    return (
      <div className={styles.carousel} role="region" aria-label="Категории BIZON Shop">
        <div className={styles.mediaFallback} aria-hidden="true" />
        <div className={styles.overlay} aria-hidden="true" />
        <div className={`${styles.content} ${styles.contentWithChildren}`}>{children}</div>
      </div>
    );
  }

  function pauseAutoplay() {
    setAutoplay(false);
  }

  function selectSlide(index: number) {
    pauseAutoplay();
    setActiveIndex((index + count) % count);
  }

  function onTouchStart(event: React.TouchEvent<HTMLElement>) {
    const touch = event.touches[0];
    touchStart.current = touch ? { x: touch.clientX, y: touch.clientY } : null;
  }

  function onTouchEnd(event: React.TouchEvent<HTMLElement>) {
    const start = touchStart.current;
    if (!start) return;
    const end = event.changedTouches[0];
    touchStart.current = null;
    if (!end || !hasMultipleSlides) return;
    const step = carouselSwipeStep(end.clientX - start.x, end.clientY - start.y);
    if (step === 0) return;
    selectSlide(activeIndex + step);
  }

  return (
    <div
      className={styles.carousel}
      role="region"
      aria-roledescription="carousel"
      aria-label="Категории BIZON Shop"
      onFocus={pauseAutoplay}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {slides.map((slide, index) => {
        const slideHidden = index !== activeIndex;
        return (
          <article
            key={slide.id}
            className={`${styles.slide} ${slideHidden ? "" : styles.slideActive}`}
            aria-hidden={slideHidden}
          >
            {slide.imageUrl ? (
              <div className={styles.media}>
                <Image src={slide.imageUrl} alt="" fill sizes="100vw" priority={index === 0} />
              </div>
            ) : (
              <div className={styles.mediaFallback} aria-hidden="true" />
            )}
            <div className={styles.overlay} aria-hidden="true" />
            {showSlideTitle ? (
              <div className={styles.content}>
                <h3 className={styles.title}>
                  <Link href={slide.href} tabIndex={slideHidden ? -1 : undefined}>{slide.title}</Link>
                </h3>
              </div>
            ) : null}
          </article>
        );
      })}

      {children ? <div className={`${styles.content} ${styles.contentWithChildren}`}>{children}</div> : null}

      {hasMultipleSlides ? (
        <div className={`${styles.controls} ${mobileStyles.mobileControls}`}>
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
