import { useState, useEffect, useCallback } from 'react';

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
  
  useEffect(() => {
    // Добавляем/удаляем класс для предотвращения прокрутки фона
    document.body.classList.toggle('menu-open', menuOpen);
    
    // Cleanup при размонтировании
    return () => {
      document.body.classList.remove('menu-open');
    };
  }, [menuOpen]);
  
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
