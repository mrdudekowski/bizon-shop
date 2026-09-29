"use client";

import { useEffect } from "react";

import {
  computeShopZoneBackdropProgress,
  getShopZoneViewportHeightPx,
  HOME_SHOP_ZONE_ENTER_ID,
  HOME_SHOP_ZONE_EXIT_ID,
  HOME_SHOP_ZONE_SHELL,
  resolveShopZoneProgress,
} from "./homeShopZone";

export function HomeShopZoneCanvas() {
  useEffect(() => {
    const shell = document.querySelector<HTMLElement>(HOME_SHOP_ZONE_SHELL);
    if (!shell) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let rafId = 0;

    const apply = () => {
      const shop = document.getElementById(HOME_SHOP_ZONE_ENTER_ID);
      const exit = document.getElementById(HOME_SHOP_ZONE_EXIT_ID);
      const progress = resolveShopZoneProgress(
        computeShopZoneBackdropProgress(shop, exit, getShopZoneViewportHeightPx()),
        reducedMotion.matches
      );
      shell.style.setProperty("--home-shop-progress", String(progress));
      shell.style.setProperty("--home-invert", progress >= 0.5 ? "1" : "0");
    };

    const schedule = () => {
      if (rafId) return;
      rafId = requestAnimationFrame(() => {
        rafId = 0;
        apply();
      });
    };

    apply();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    reducedMotion.addEventListener("change", apply);
    window.visualViewport?.addEventListener("resize", schedule);
    window.visualViewport?.addEventListener("scroll", schedule);

    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      reducedMotion.removeEventListener("change", apply);
      window.visualViewport?.removeEventListener("resize", schedule);
      window.visualViewport?.removeEventListener("scroll", schedule);
      if (rafId) cancelAnimationFrame(rafId);
      shell.style.removeProperty("--home-shop-progress");
      shell.style.removeProperty("--home-invert");
    };
  }, []);

  return null;
}
