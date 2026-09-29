"use client";

import { useEffect, useState } from "react";

export type ChromeTone = "light" | "dark";

export function useAdaptiveChrome(
  toneAttribute: string,
  fallbackTone: ChromeTone,
) {
  const [tone, setTone] = useState<ChromeTone>(fallbackTone);

  useEffect(() => {
    let frame = 0;

    const update = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => {
        const section = document
          .elementsFromPoint(window.innerWidth / 2, 104)
          .map((element) => element.closest?.(`[${toneAttribute}]`))
          .find(Boolean);
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
  }, [fallbackTone, toneAttribute]);

  return { tone };
}
