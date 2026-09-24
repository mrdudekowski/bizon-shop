export const MENU_CURATION_FALLBACK_LIMIT = 12;

export type MenuCuratable = {
  showInMenu?: boolean | null;
  menuOrder?: number | null;
};

/**
 * Prefer items flagged showInMenu (ordered by menuOrder).
 * If none are flagged, take the first `fallbackLimit` in menuOrder/input order.
 */
export function curateMenuItems<T extends MenuCuratable>(
  items: T[],
  fallbackLimit = MENU_CURATION_FALLBACK_LIMIT,
): T[] {
  const sorted = [...items].sort(
    (a, b) => (a.menuOrder ?? 0) - (b.menuOrder ?? 0),
  );
  const flagged = sorted.filter((item) => item.showInMenu === true);
  if (flagged.length > 0) return flagged;
  return sorted.slice(0, fallbackLimit);
}
