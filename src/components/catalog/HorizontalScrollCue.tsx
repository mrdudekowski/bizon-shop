"use client";

import { useEffect, useState, type RefObject } from "react";

import { SiteArrow } from "@/components/SiteArrow/SiteArrow";

import { activeLoopIndex } from "./loopScroll";
import styles from "./HorizontalScrollCue.module.css";

type HorizontalScrollCueProps = {
  trackRef: RefObject<HTMLElement | null>;
  count: number;
  tone?: "light" | "dark";
  label?: string;
};

export function HorizontalScrollCue({
  trackRef,
  count,
  tone = "light",
  label = "Листайте",
}: HorizontalScrollCueProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const track = trackRef.current;
    if (!track || count < 2) return undefined;

    const update = () => {
      const origin = track.getBoundingClientRect().left;
      const cardOffsets = Array.from(track.children, (card) => (
        card.getBoundingClientRect().left - origin + track.scrollLeft
      ));
      const next = activeLoopIndex(track.scrollLeft, count, cardOffsets);
      setActiveIndex((current) => (current === next ? current : next));
    };

    update();

    let scrollTimer: ReturnType<typeof setTimeout> | undefined;
    const onScrollFallback = () => {
      clearTimeout(scrollTimer);
      scrollTimer = setTimeout(update, 120);
    };

    if ("onscrollend" in window) {
      track.addEventListener("scrollend", update);
    } else {
      track.addEventListener("scroll", onScrollFallback, { passive: true });
    }

    window.addEventListener("resize", update);
    return () => {
      if ("onscrollend" in window) {
        track.removeEventListener("scrollend", update);
      } else {
        track.removeEventListener("scroll", onScrollFallback);
        clearTimeout(scrollTimer);
      }
      window.removeEventListener("resize", update);
    };
  }, [count, trackRef]);

  const scrollStep = () => {
    const track = trackRef.current;
    if (!track) return;
    const { scrollLeft, scrollWidth, clientWidth } = track;
    const maxScroll = scrollWidth - clientWidth;
    if (maxScroll <= 4) return;
    const nextLeft = scrollLeft >= maxScroll - 16 ? 0 : scrollLeft + Math.round(clientWidth * 0.82);
    track.scrollTo({ left: nextLeft, behavior: "smooth" });
  };

  return (
    <div className={styles.cue} data-tone={tone}>
      <div className={styles.rail} aria-hidden="true">
        {Array.from({ length: count }, (_, index) => (
          <span key={index} className={styles.segment} data-active={index === activeIndex ? "true" : "false"} />
        ))}
      </div>
      <button type="button" className={styles.hint} onClick={scrollStep}>
        <span>{label}</span>
        <SiteArrow />
      </button>
    </div>
  );
}
