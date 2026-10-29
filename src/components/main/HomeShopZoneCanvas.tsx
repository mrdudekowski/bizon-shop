"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

import { HOME_SHOP_ZONE_SECTION_ID } from "./homeShopZone";

const CANVAS_WHITE = "#ffffff";
const CANVAS_BLACK = "#0a0a0a";
const INK_ON_WHITE = "#1c1c1c";
const INK_ON_BLACK = "#ffffff";

export function HomeShopZoneCanvas() {
  const pathname = usePathname();

  useEffect(() => {
    const shop = document.getElementById(HOME_SHOP_ZONE_SECTION_ID);
    if (!shop) return undefined;

    const paint = (shopOnScreen: boolean) => {
      document.documentElement.style.setProperty("--page-canvas", shopOnScreen ? CANVAS_BLACK : CANVAS_WHITE);
      document.documentElement.style.setProperty("--page-ink", shopOnScreen ? INK_ON_BLACK : INK_ON_WHITE);
    };

    paint(false);
    const observer = new IntersectionObserver(([entry]) => {
      paint(entry.isIntersecting);
    }, { threshold: 0 });
    observer.observe(shop);

    return () => {
      observer.disconnect();
      document.documentElement.style.removeProperty("--page-canvas");
      document.documentElement.style.removeProperty("--page-ink");
    };
  }, [pathname]);

  return null;
}
