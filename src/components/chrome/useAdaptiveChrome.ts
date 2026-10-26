"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export type ChromeTone = "light" | "dark";

export function useAdaptiveChrome(
  toneAttribute: string,
  fallbackTone: ChromeTone,
) {
  const pathname = usePathname();
  const [tone, setTone] = useState<ChromeTone>(fallbackTone);

  useEffect(() => {
    let frame = 0;

    const update = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => {
        const probeY = Math.min(window.innerHeight - 1, 112);
        const section =
          document
            .elementsFromPoint(window.innerWidth / 2, probeY)
            .map((element) => element.closest?.(`[${toneAttribute}]`))
            .find(Boolean) ??
          (window.scrollY < 64
            ? document.querySelector<HTMLElement>(`main [${toneAttribute}]`)
            : null);
        const requestedTone = section?.getAttribute(toneAttribute);

        setTone(
          requestedTone === "light" || requestedTone === "dark"
            ? requestedTone
            : fallbackTone,
        );
      });
    };

    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update, { passive: true });

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [fallbackTone, pathname, toneAttribute]);

  return { tone };
}
