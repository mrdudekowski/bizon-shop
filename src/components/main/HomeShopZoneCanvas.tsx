"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

import { canvasToneColor, inkForCanvas, resolveCanvasColor } from "./canvasColor";

export function HomeShopZoneCanvas() {
  const pathname = usePathname();

  useEffect(() => {
    const root = document.querySelector<HTMLElement>("[data-canvas-page]");
    if (!root) return undefined;

    let frame = 0;
    const apply = () => {
      const headerLine = Number.parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--header-height")) || 80;
      const viewportHeight = window.visualViewport?.height ?? window.innerHeight;
      const stops = [...root.querySelectorAll<HTMLElement>("[data-canvas-tone]")].map((element) => ({
        top: element.getBoundingClientRect().top,
        color: canvasToneColor(element.getAttribute("data-canvas-tone")),
      }));
      const canvas = resolveCanvasColor(stops, viewportHeight, headerLine);
      document.documentElement.style.setProperty("--page-canvas", canvas);
      document.documentElement.style.setProperty("--page-ink", inkForCanvas(canvas));
    };
    const schedule = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        apply();
      });
    };

    apply();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    window.visualViewport?.addEventListener("resize", schedule);
    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      window.visualViewport?.removeEventListener("resize", schedule);
      if (frame) window.cancelAnimationFrame(frame);
      document.documentElement.style.removeProperty("--page-canvas");
      document.documentElement.style.removeProperty("--page-ink");
    };
  }, [pathname]);

  return null;
}
