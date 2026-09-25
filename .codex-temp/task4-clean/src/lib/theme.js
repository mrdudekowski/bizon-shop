/** @see docs/theme-palette.md */

export const THEME_STORAGE_KEY = "theme";

/** @typedef {'light' | 'dark'} ThemePreference */

function isBrowser() {
  return typeof window !== "undefined";
}

export function getSystemPrefersDark() {
  if (!isBrowser()) return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

/** Есть ли явный выбор пользователя (клик по переключателю) */
export function hasStoredTheme() {
  if (!isBrowser()) return false;
  const stored = localStorage.getItem(THEME_STORAGE_KEY);
  return stored === "light" || stored === "dark";
}

/** @returns {ThemePreference | null} */
export function getStoredTheme() {
  if (!isBrowser()) return null;
  const stored = localStorage.getItem(THEME_STORAGE_KEY);
  if (stored === "light" || stored === "dark") {
    return stored;
  }
  return null;
}

/** Фактическая тема: localStorage или системная */
export function getIsDark() {
  if (!isBrowser()) return false;
  const stored = getStoredTheme();
  if (stored === "dark") return true;
  if (stored === "light") return false;
  return getSystemPrefersDark();
}

/**
 * @param {ThemePreference} theme
 */
export function applyTheme(theme) {
  if (!isBrowser()) return;
  document.documentElement.classList.toggle("dark", theme === "dark");
}

export function applyResolvedTheme() {
  if (!isBrowser()) return;
  document.documentElement.classList.toggle("dark", getIsDark());
}

/**
 * @param {ThemePreference} theme
 */
export function setTheme(theme) {
  if (!isBrowser()) return;
  localStorage.setItem(THEME_STORAGE_KEY, theme);
  applyTheme(theme);
}

/** Следим за ОС, пока пользователь не выбрал тему вручную */
export function watchSystemTheme(onChange) {
  if (!isBrowser()) return () => {};
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  const handler = () => {
    if (!hasStoredTheme()) {
      onChange(getSystemPrefersDark());
    }
  };
  media.addEventListener("change", handler);
  return () => media.removeEventListener("change", handler);
}
