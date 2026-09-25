"use client";

import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";
import { SECTIONS } from "@/constants/sections";

/**
 * Плавающая кнопка «наверх» — видна после прокрутки мимо секции с каруселью
 */
export const BackToTop = ({ onScrollToTop }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const productsSection = document.getElementById(SECTIONS.PRODUCTS);

    if (!productsSection) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        const scrolledPast =
          !entry.isIntersecting && entry.boundingClientRect.top < 0;
        setIsVisible(scrolledPast);
      },
      { threshold: 0 }
    );

    observer.observe(productsSection);

    return () => observer.disconnect();
  }, []);

  return (
    <button
      type="button"
      className={`back-to-top ${isVisible ? "back-to-top--visible" : ""}`}
      aria-label="Прокрутить наверх"
      aria-hidden={!isVisible}
      tabIndex={isVisible ? 0 : -1}
      onClick={onScrollToTop}
    >
      <ArrowUp size={20} strokeWidth={2} aria-hidden="true" />
    </button>
  );
};
