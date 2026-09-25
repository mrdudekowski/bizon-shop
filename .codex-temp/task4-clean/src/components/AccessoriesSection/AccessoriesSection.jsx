"use client";

import { SECTIONS } from "@/constants/sections";
import { useScrollToSection } from "@/hooks/useScrollToSection";

/**
 * Баннер перехода к аксессуарам — media block для будущего субдомена
 */
export const AccessoriesSection = () => {
  const scrollToSection = useScrollToSection();

  return (
    <section
      id={SECTIONS.ACCESSORIES}
      className="section"
      aria-labelledby="accessories-heading"
    >
      <div className="accessories-banner">
        <div className="accessories-banner-media" aria-hidden="true" />
        <div className="accessories-banner-overlay" aria-hidden="true" />
        <div className="accessories-banner-content">
          <h2 id="accessories-heading">BIZON Accessories</h2>
          <p>Everything your fleet needs beyond tyres.</p>
          <button
            type="button"
            className="btn-glass"
            onClick={() => scrollToSection(SECTIONS.CONTACT)}
          >
            Go to accessories
          </button>
        </div>
      </div>
    </section>
  );
};
