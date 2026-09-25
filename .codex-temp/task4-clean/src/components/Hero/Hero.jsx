"use client";

import { SECTIONS } from "@/constants/sections";
import { useScrollToSection } from "@/hooks/useScrollToSection";

/**
 * Cinematic hero — premium industrial first screen
 */
export const Hero = () => {
  const scrollToSection = useScrollToSection();

  return (
    <section id={SECTIONS.HERO} className="hero">
      <div className="hero-media" aria-hidden="true">
        <div className="hero-media-bg image-placeholder">
          Hero media
        </div>
        <div className="hero-overlay" />
      </div>

      <div className="hero-container">
        <div className="hero-content">
          <p className="eyebrow">BIZON · большегрузная резина</p>
          <h1>Уверенное сцепление на любых дорогах</h1>
          <p className="hero-text">
            Шины для магистралей, карьеров и бездорожья. Поставки для автопарков,
            подбор под тяжёлую технику и индивидуальное изготовление.
          </p>
          <div className="hero-actions">
            <button
              type="button"
              className="btn-accent"
              onClick={() => scrollToSection(SECTIONS.PRODUCTS)}
            >
              Каталог
            </button>
            <button
              type="button"
              className="btn-glass"
              onClick={() => scrollToSection(SECTIONS.FEATURES)}
            >
              Подробнее
            </button>
          </div>
        </div>
      </div>

      <div className="hero-scroll-hint" aria-hidden="true" />
    </section>
  );
};
