import { useState, useEffect } from 'react';

/**
 * Хук для отслеживания медиа-запросов
 * SSR-безопасная версия с улучшенной обработкой edge cases
 * 
 * @param {string} query - CSS медиа-запрос (например, "(max-width: 768px)")
 * @returns {boolean} Соответствует ли текущее окно медиа-запросу
 * 
 * @example
 * const isMobile = useMediaQuery("(max-width: 768px)");
 */
export const useMediaQuery = (query) => {
  const [matches, setMatches] = useState(() => {
    // SSR безопасность - проверяем наличие window
    if (typeof window === 'undefined' || !window.matchMedia) {
      return false;
    }
    
    try {
      return window.matchMedia(query).matches;
    } catch (error) {
      console.warn(`Invalid media query: ${query}`, error);
      return false;
    }
  });

  useEffect(() => {
    // Дополнительная проверка для SSR
    if (typeof window === 'undefined' || !window.matchMedia) {
      return;
    }
    
    let media;
    try {
      media = window.matchMedia(query);
    } catch (error) {
      console.warn(`Invalid media query: ${query}`, error);
      return;
    }
    
    const handler = (event) => {
      setMatches(event.matches);
    };
    
    // Проверяем поддержку addEventListener (современные браузеры)
    if (media.addEventListener) {
      media.addEventListener('change', handler);
      return () => {
        media.removeEventListener('change', handler);
      };
    } else {
      // Fallback для старых браузеров (IE11 и ниже)
      media.addListener(handler);
      return () => {
        media.removeListener(handler);
      };
    }
  }, [query]);

  return matches;
};
