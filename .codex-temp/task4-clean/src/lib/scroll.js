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
 * @returns {number}
 */
export function getHeaderOffset() {
  const raw = getComputedStyle(document.documentElement).getPropertyValue(
    "--header-height"
  );
  const parsed = parseInt(raw, 10);
  return Number.isFinite(parsed) ? parsed : HEADER_OFFSET_FALLBACK_PX;
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
