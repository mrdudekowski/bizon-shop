"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

import { canvasToneColor, inkForCanvas } from "./canvasColor";

export function HomeShopZoneCanvas() {
  const pathname = usePathname();

  useEffect(() => {
    const root = document.querySelector<HTMLElement>("[data-canvas-page]");
    if (!root) return undefined;
    const sections = [...root.querySelectorAll<HTMLElement>("[data-canvas-tone]")];
    let painted = "";
    const paint = (tone: string | null) => {
      const canvas = canvasToneColor(tone);
      if (canvas === painted) return;
      painted = canvas;
      document.documentElement.style.setProperty("--page-canvas", canvas);
      document.documentElement.style.setProperty("--page-ink", inkForCanvas(canvas));
    };
    const headerLine = Number.parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--header-height")) || 80;
    const visible = new Map<Element, number>();
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) visible.set(entry.target, entry.boundingClientRect.top);
        else visible.delete(entry.target);
      }
      const active = [...visible.entries()].sort((left, right) => left[1] - right[1])[0];
      paint(active ? (active[0] as HTMLElement).getAttribute("data-canvas-tone") : null);
    }, { rootMargin: `-${headerLine}px 0px -60% 0px`, threshold: 0 });
    for (const section of sections) observer.observe(section);
    return () => {
      observer.disconnect();
      document.documentElement.style.removeProperty("--page-canvas");
      document.documentElement.style.removeProperty("--page-ink");
    };
  }, [pathname]);

  return null;
}
