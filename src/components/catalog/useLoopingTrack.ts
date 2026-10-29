"use client";

import { useEffect, type RefObject } from "react";

import { loopPeriod, nextLoopScroll } from "./loopScroll";

export function useLoopingTrack(
  trackRef: RefObject<HTMLElement | null>,
  itemCount: number,
): void {
  useEffect(() => {
    const track = trackRef.current;
    if (!track || itemCount < 2) return undefined;
    const media = window.matchMedia("(max-width: 1023px)");

    const offsets = () => Array.from(track.children, (card) => (card as HTMLElement).offsetLeft);

    const pin = () => {
      if (!media.matches) return;
      const period = loopPeriod(offsets(), itemCount);
      if (period <= 0) return;
      const next = nextLoopScroll(track.scrollLeft, period);
      if (next !== track.scrollLeft) track.scrollLeft = next;
    };

    const start = () => {
      if (!media.matches) {
        track.scrollLeft = 0;
        return;
      }
      const period = loopPeriod(offsets(), itemCount);
      if (period > 0) track.scrollLeft = period;
    };

    start();
    track.addEventListener("scrollend", pin);
    media.addEventListener("change", start);
    return () => {
      track.removeEventListener("scrollend", pin);
      media.removeEventListener("change", start);
    };
  }, [itemCount, trackRef]);
}
