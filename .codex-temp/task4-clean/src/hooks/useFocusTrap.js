import { useEffect, useRef } from 'react';

/**
 * Хук для создания focus trap в модальных окнах
 * Удерживает focus внутри контейнера и предотвращает выход за его пределы
 * 
 * @param {boolean} isActive - Активен ли focus trap
 * @returns {React.RefObject} Ref для контейнера
 * 
 * @example
 * const menuRef = useFocusTrap(isOpen);
 * <aside ref={menuRef}>...</aside>
 */
export const useFocusTrap = (isActive) => {
  const containerRef = useRef(null);
  
  useEffect(() => {
    if (!isActive || !containerRef.current) return;
    
    const container = containerRef.current;
    
    // Находим все фокусируемые элементы внутри контейнера
    const getFocusableElements = () => {
      const selector = [
        'button:not([disabled])',
        '[href]',
        'input:not([disabled])',
        'select:not([disabled])',
        'textarea:not([disabled])',
        '[tabindex]:not([tabindex="-1"])',
      ].join(', ');
      
      return Array.from(container.querySelectorAll(selector)).filter(
        (el) => {
          // Проверяем, что элемент видим
          const style = window.getComputedStyle(el);
          return style.display !== 'none' && style.visibility !== 'hidden';
        }
      );
    };
    
    const focusableElements = getFocusableElements();
    
    if (focusableElements.length === 0) return;
    
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];
    
    // Фокусируем первый элемент при открытии
    firstElement?.focus();
    
    const handleTab = (e) => {
      if (e.key !== 'Tab') return;
      
      // Если только один элемент, предотвращаем переход
      if (focusableElements.length === 1) {
        e.preventDefault();
        firstElement?.focus();
        return;
      }
      
      if (e.shiftKey) {
        // Shift + Tab - переход назад
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        // Tab - переход вперед
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };
    
    container.addEventListener('keydown', handleTab);
    
    return () => {
      container.removeEventListener('keydown', handleTab);
    };
  }, [isActive]);
  
  return containerRef;
};
