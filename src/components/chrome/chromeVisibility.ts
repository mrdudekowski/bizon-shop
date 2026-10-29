export type ChromeVisibility = "shown" | "hidden";

export function nextChromeVisibility(
  current: ChromeVisibility,
  scrollY: number,
  previousScrollY: number,
  mobile: boolean,
): ChromeVisibility {
  if (!mobile || scrollY <= 0) return "shown";
  const delta = scrollY - previousScrollY;
  if (delta > 8) return "hidden";
  if (delta < -8) return "shown";
  return current;
}
