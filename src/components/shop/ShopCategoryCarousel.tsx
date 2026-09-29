"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { SiteArrow } from "@/components/SiteArrow/SiteArrow";
import type { ShopCategorySlide } from "@/lib/content/pages/types";
import { ShopResponsiveImage } from "./ShopResponsiveImage";
import styles from "./ShopCategoryCarousel.module.css";

export function ShopCategoryCarousel({
  slides,
}: {
  slides: readonly ShopCategorySlide[];
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [autoplay, setAutoplay] = useState(true);
  const touchStartX = useRef<number | null>(null);

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
    const delta = (event.changedTouches[0]?.clientX ?? touchStartX.current) - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(delta) < 48) return;
    selectSlide(activeIndex + (delta < 0 ? 1 : -1));
  };

  return (
    <section
      className={styles.carousel}
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
          <ShopResponsiveImage
            className={styles.media}
            desktopSrc={slide.desktopImage}
            mobileSrc={slide.mobileImage}
            alt={slide.alt}
          />
          <div className={styles.overlay} aria-hidden="true" />
          <div className={styles.content}>
            <p>{slide.kicker}</p>
            <h2>{slide.title}</h2>
            <Link href={slide.href} tabIndex={index === activeIndex ? 0 : -1}>
              {slide.action}
            </Link>
          </div>
        </article>
      ))}

      <div className={styles.controls}>
        <div className={styles.progress}>
          {slides.map((slide, index) => (
            <button
              key={slide.id}
              type="button"
              className={index === activeIndex ? styles.progressActive : ""}
              onClick={() => selectSlide(index)}
              aria-label={`Показать категорию ${slide.kicker}`}
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
            aria-label={autoplay ? "Приостановить карусель" : "Запустить карусель"}
          >
            {autoplay ? "Пауза" : "Старт"}
          </button>
          <button type="button" onClick={() => selectSlide(activeIndex - 1)} aria-label="Предыдущая категория"><SiteArrow direction="left" /></button>
          <button type="button" onClick={() => selectSlide(activeIndex + 1)} aria-label="Следующая категория"><SiteArrow /></button>
        </div>
      </div>
    </section>
  );
}
