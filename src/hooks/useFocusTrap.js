import { useEffect, useRef } from 'react';

const FOCUSABLE_SELECTOR = [
  'button:not([disabled])',
  '[href]',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ');

function isEligibleFocusTarget(element, container) {
  if (element.tabIndex < 0) return false;

  let node = element;
  while (node) {
    if (node.hasAttribute('inert') || node.hasAttribute('hidden')) return false;
    if (node.getAttribute('aria-hidden') === 'true') return false;
    const style = window.getComputedStyle(node);
    if (style.display === 'none' || style.visibility === 'hidden') return false;
    if (node === container) break;
    node = node.parentElement;
  }

  return element.getClientRects().length > 0;
}

function eligibleFocusTargets(container) {
  return Array.from(container.querySelectorAll(FOCUSABLE_SELECTOR)).filter((element) =>
    isEligibleFocusTarget(element, container),
  );
}

/**
 * Хук для создания focus trap в модальных окнах.
 * Список целей читается заново на Tab и при смене разметки: панели меню
 * появляются и получают inert уже после открытия.
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
  const returnFocusRef = useRef(null);

  useEffect(() => {
    if (!isActive) return undefined;
    const container = containerRef.current;
    if (!container) return undefined;

    const previousFocus = document.activeElement;
    returnFocusRef.current = previousFocus instanceof HTMLElement ? previousFocus : null;
    let seen = [];

    const placeFocus = (shiftKey) => {
      const items = eligibleFocusTargets(container);
      const active = document.activeElement;
      if (items.includes(active)) {
        seen = items;
        return items;
      }
      const fresh = items.find((element) => !seen.includes(element));
      const fallback = shiftKey ? items[items.length - 1] : items[0];
      (fresh ?? fallback)?.focus({ preventScroll: true });
      seen = items;
      return items;
    };

    const onKeyDown = (event) => {
      if (event.key !== 'Tab') return;
      const items = eligibleFocusTargets(container);
      if (items.length === 0) return;

      event.preventDefault();
      const index = items.indexOf(document.activeElement);
      if (index === -1) {
        placeFocus(event.shiftKey);
        return;
      }

      const nextIndex = event.shiftKey
        ? (index - 1 + items.length) % items.length
        : (index + 1) % items.length;
      items[nextIndex].focus({ preventScroll: true });
      seen = items;
    };

    const observer = new MutationObserver(() => {
      placeFocus(false);
    });
    observer.observe(container, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ['inert', 'hidden', 'aria-hidden', 'disabled', 'tabindex', 'style'],
    });

    placeFocus(false);
    container.addEventListener('keydown', onKeyDown);

    return () => {
      container.removeEventListener('keydown', onKeyDown);
      observer.disconnect();
      const restore = returnFocusRef.current;
      returnFocusRef.current = null;
      seen = [];
      if (restore?.isConnected) restore.focus({ preventScroll: true });
    };
  }, [isActive]);

  return containerRef;
};
