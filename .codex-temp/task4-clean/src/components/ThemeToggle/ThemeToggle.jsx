"use client";

import { useCallback, useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import {
  applyResolvedTheme,
  getIsDark,
  setTheme,
  watchSystemTheme,
} from "@/lib/theme";

/**
 * Переключатель светлая / тёмная тема (см. docs/theme-palette.md)
 */
export function ThemeToggle() {
  const [isDark, setIsDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setIsDark(getIsDark());
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    applyResolvedTheme();
  }, [isDark, mounted]);

  useEffect(() => {
    if (!mounted) return;
    return watchSystemTheme(setIsDark);
  }, [mounted]);

  const toggleTheme = useCallback(() => {
    setIsDark((current) => {
      const nextDark = !current;
      setTheme(nextDark ? "dark" : "light");
      return nextDark;
    });
  }, []);

  const Icon = isDark ? Sun : Moon;
  const label = isDark ? "Включить светлую тему" : "Включить тёмную тему";

  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={toggleTheme}
      aria-label={mounted ? label : "Переключить тему"}
      title={mounted ? label : "Переключить тему"}
      aria-pressed={mounted ? isDark : undefined}
      suppressHydrationWarning
    >
      {mounted ? <Icon aria-hidden="true" /> : <Moon aria-hidden="true" />}
    </button>
  );
}
