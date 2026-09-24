const HEADER_OFFSET_FALLBACK_PX = 80;

/**
 * @returns {'smooth' | 'auto'}
 */
export function getScrollBehavior() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ? "auto"
    : "smooth";
}

/**
 * Resolves --header-height (may be calc + safe-area) to CSS pixels.
 * @returns {number}
 */
export function getHeaderOffset() {
  const probe = document.createElement("div");
  probe.style.cssText =
    "position:absolute;visibility:hidden;pointer-events:none;height:var(--header-height)";
  document.documentElement.appendChild(probe);
  const value = probe.offsetHeight;
  probe.remove();
  return value > 0 ? value : HEADER_OFFSET_FALLBACK_PX;
}

/**
 * @param {string} sectionId
 */
export function scrollToSectionId(sectionId) {
  if (!sectionId || typeof sectionId !== "string") {
    console.warn("scrollToSectionId: sectionId должен быть непустой строкой");
    return;
  }

  const target = document.getElementById(sectionId);

  if (!target) {
    console.warn(`scrollToSectionId: секция с id "${sectionId}" не найдена`);
    return;
  }

  target.scrollIntoView({
    behavior: getScrollBehavior(),
    block: "start",
  });
}

export function scrollToTop() {
  window.scrollTo({
    top: 0,
    behavior: getScrollBehavior(),
  });
}
