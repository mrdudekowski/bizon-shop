import { useState, useEffect, useCallback, useRef } from 'react';
import { useLenis } from 'lenis/react';

/**
 * Хук для управления состоянием мобильного меню
 * Автоматически управляет классом body для предотвращения прокрутки фона
 * 
 * @returns {Object} Объект с состоянием и методами управления меню
 * @returns {boolean} menuOpen - Открыто ли меню
 * @returns {Function} openMenu - Открыть меню
 * @returns {Function} closeMenu - Закрыть меню
 * @returns {Function} toggleMenu - Переключить состояние меню
 * 
 * @example
 * const { menuOpen, openMenu, closeMenu, toggleMenu } = useMenuToggle();
 */
export const useMenuToggle = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const scrollPositionRef = useRef(0);
  const lenis = useLenis();
  
  useEffect(() => {
    if (!menuOpen) return undefined;

    const y = typeof lenis?.scroll === "number" ? lenis.scroll : window.scrollY;
    scrollPositionRef.current = y;
    lenis?.stop();
    document.body.style.setProperty('--scroll-lock-top', `-${y}px`);
    document.body.classList.add('menu-open');

    return () => {
      document.body.classList.remove('menu-open');
      document.body.style.removeProperty('--scroll-lock-top');
      const scrollPosition = scrollPositionRef.current;
      lenis?.start();
      lenis?.scrollTo(scrollPosition, { immediate: true, force: true });
      window.scrollTo(0, scrollPosition);
    };
  }, [menuOpen, lenis]);
  
  const openMenu = useCallback(() => {
    setMenuOpen(true);
  }, []);
  
  const closeMenu = useCallback(() => {
    setMenuOpen(false);
  }, []);
  
  const toggleMenu = useCallback(() => {
    setMenuOpen(prev => !prev);
  }, []);
  
  return { menuOpen, openMenu, closeMenu, toggleMenu, setMenuOpen };
};
