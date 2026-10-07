import { useCallback } from "react";
import { useLenis } from "lenis/react";
import { scrollToSectionId } from "@/lib/scroll";

/**
 * Хук для плавной прокрутки к секциям страницы
 *
 * @returns {Function} Функция для прокрутки к секции по ID
 *
 * @example
 * const scrollToSection = useScrollToSection();
 * scrollToSection('products');
 */
export const useScrollToSection = () => {
  const lenis = useLenis();

  return useCallback((sectionId) => {
    scrollToSectionId(sectionId, lenis);
  }, [lenis]);
};
