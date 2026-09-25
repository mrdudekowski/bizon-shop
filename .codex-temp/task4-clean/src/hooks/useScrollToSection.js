import { useCallback } from "react";
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
  return useCallback((sectionId) => {
    scrollToSectionId(sectionId);
  }, []);
};
