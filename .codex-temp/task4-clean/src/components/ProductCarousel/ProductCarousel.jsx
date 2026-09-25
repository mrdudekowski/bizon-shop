"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

import { CatalogImage } from "@/components/catalog/CatalogImage";
import { parseBulletPoints } from "@/utils/textUtils";

function syncScrollButtons(track, setCanPrev, setCanNext) {
  if (!track) return;
  const tolerance = 1;
  setCanPrev(track.scrollLeft > tolerance);
  setCanNext(track.scrollLeft < track.scrollWidth - track.clientWidth - tolerance);
}

export default function ProductCarousel({ items = [] }) {
  const trackRef = useRef(null);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  const updateScrollButtons = useCallback(() => {
    syncScrollButtons(trackRef.current, setCanScrollPrev, setCanScrollNext);
  }, []);

  useEffect(() => {
    const track = trackRef.current;
    if (!track || items.length === 0) return;

    updateScrollButtons();
    track.addEventListener("scroll", updateScrollButtons, { passive: true });
    window.addEventListener("resize", updateScrollButtons);
    track.addEventListener("scrollend", updateScrollButtons);

    return () => {
      track.removeEventListener("scroll", updateScrollButtons);
      window.removeEventListener("resize", updateScrollButtons);
      track.removeEventListener("scrollend", updateScrollButtons);
    };
  }, [items.length, updateScrollButtons]);

  const scrollByPage = (direction) => {
    const track = trackRef.current;
    if (!track) return;
    track.scrollBy({ left: direction * track.clientWidth, behavior: "smooth" });
  };

  if (items.length === 0) {
    return <p className="section-description">Нет доступных категорий шин.</p>;
  }

  return (
    <div className="product-carousel">
      <div
        className="product-carousel-track"
        ref={trackRef}
        role="region"
        aria-label="Категории шин"
        tabIndex={0}
        onKeyDown={(event) => {
          if (event.key === "ArrowLeft") {
            event.preventDefault();
            scrollByPage(-1);
          }
          if (event.key === "ArrowRight") {
            event.preventDefault();
            scrollByPage(1);
          }
        }}
      >
        {items.map((item) => {
          const summary = parseBulletPoints(item.shortDescription).slice(0, 3).join(" · ");

          return (
            <Link key={item.slug} href={`/models/${item.slug}`} className="category-card">
              <div className="category-card-media" aria-hidden="true">
                <CatalogImage src={item.imageUrl} alt="" fill sizes="80vw" />
              </div>
              <div className="category-card-overlay" aria-hidden="true" />
              <div className="category-card-content">
                <h3 className="category-card-title">{item.name}</h3>
                {summary ? <p className="category-card-desc">{summary}</p> : null}
              </div>
              <span className="category-card-arrow" aria-hidden="true">
                →
              </span>
            </Link>
          );
        })}
      </div>

      <button
        type="button"
        className="carousel-nav carousel-nav-prev"
        onClick={() => scrollByPage(-1)}
        disabled={!canScrollPrev}
        aria-label="Предыдущая категория"
      >
        ←
      </button>

      <button
        type="button"
        className="carousel-nav carousel-nav-next"
        onClick={() => scrollByPage(1)}
        disabled={!canScrollNext}
        aria-label="Следующая категория"
      >
        →
      </button>
    </div>
  );
}
