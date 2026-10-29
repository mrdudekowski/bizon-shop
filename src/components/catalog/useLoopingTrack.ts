"use client";

import { useEffect, type RefObject } from "react";

import { nextLoopScroll } from "./loopScroll";

export function useLoopingTrack(
  trackRef: RefObject<HTMLElement | null>,
  itemCount: number,
): void {
  useEffect(() => {
    const track = trackRef.current;
    if (!track || itemCount < 2) return undefined;
    const media = window.matchMedia("(max-width: 1023px)");
    let frame = 0;

    const pin = () => {
      if (!media.matches) return;
      const cycleWidth = track.scrollWidth / 2;
      const next = nextLoopScroll(track.scrollLeft, cycleWidth);
      if (next !== track.scrollLeft) track.scrollLeft = next;
    };

    const start = () => {
      if (!media.matches) {
        track.scrollLeft = 0;
        return;
      }
      track.scrollLeft = track.scrollWidth / 2;
    };

    start();
    const onScroll = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(pin);
    };
    track.addEventListener("scroll", onScroll, { passive: true });
    media.addEventListener("change", start);
    return () => {
      window.cancelAnimationFrame(frame);
      track.removeEventListener("scroll", onScroll);
      media.removeEventListener("change", start);
    };
  }, [itemCount, trackRef]);
}
