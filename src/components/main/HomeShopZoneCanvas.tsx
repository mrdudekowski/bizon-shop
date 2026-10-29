"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

import { canvasToneColor, inkForCanvas, nextCanvasTone } from "./canvasColor";
import { detectCanvasPaintMode } from "./detectCanvasPaintMode";

export function HomeShopZoneCanvas() {
  const pathname = usePathname();

  useEffect(() => {
    const root = document.querySelector<HTMLElement>("[data-canvas-page]");
    if (!root) return undefined;
    const sections = [...root.querySelectorAll<HTMLElement>("[data-canvas-tone]")];
    let held: "light" | "dark" = "dark";
    let painted = "";
    const paint = (active: string | null) => {
      held = nextCanvasTone(active, held);
      const canvas = canvasToneColor(held);
      if (canvas === painted) return;
      painted = canvas;
      document.documentElement.style.setProperty("--page-canvas", canvas);
      document.documentElement.style.setProperty("--page-ink", inkForCanvas(canvas));
    };
    let observer: IntersectionObserver | undefined;
    let cancelled = false;
    const start = async () => {
      const mode = await detectCanvasPaintMode();
      if (cancelled) return;
      if (mode === "static") document.documentElement.dataset.canvasPaint = "static";
      const headerLine = Number.parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--header-height")) || 80;
      const visible = new Set<Element>();
      observer = new IntersectionObserver((entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) visible.add(entry.target);
          else visible.delete(entry.target);
        }
        const active = sections.find((section) => visible.has(section));
        paint(active ? active.getAttribute("data-canvas-tone") : null);
      }, { rootMargin: `-${headerLine}px 0px -60% 0px`, threshold: 0 });
      for (const section of sections) observer.observe(section);
    };
    void start();
    return () => {
      cancelled = true;
      observer?.disconnect();
      delete document.documentElement.dataset.canvasPaint;
      document.documentElement.style.removeProperty("--page-canvas");
      document.documentElement.style.removeProperty("--page-ink");
    };
  }, [pathname]);

  return null;
}
