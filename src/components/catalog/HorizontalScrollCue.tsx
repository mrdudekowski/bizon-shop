"use client";

import type { CSSProperties, RefObject } from "react";
import { useEffect, useState } from "react";

import { SiteArrow } from "@/components/SiteArrow/SiteArrow";

import styles from "./HorizontalScrollCue.module.css";

type HorizontalScrollCueProps = {
  trackRef: RefObject<HTMLElement | null>;
  tone?: "light" | "dark";
  label?: string;
};

export function HorizontalScrollCue({
  trackRef,
  tone = "light",
  label = "Листайте",
}: HorizontalScrollCueProps) {
  const [thumbStyle, setThumbStyle] = useState<CSSProperties>({
    "--thumb-width": "34%",
    "--thumb-offset": "0%",
  } as CSSProperties);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    const update = () => {
      const { scrollLeft, scrollWidth, clientWidth } = track;
      const maxScroll = Math.max(0, scrollWidth - clientWidth);
      const ratio = scrollWidth > 0 ? Math.min(1, Math.max(0.22, clientWidth / scrollWidth)) : 0.34;
      const progress = maxScroll > 0 ? Math.min(1, Math.max(0, scrollLeft / maxScroll)) : 0;
      const thumbWidthPct = Math.round(ratio * 1000) / 10;
      const thumbOffsetPct = Math.round(progress * (100 - thumbWidthPct) * 10) / 10;

      setThumbStyle({
        "--thumb-width": `${thumbWidthPct}%`,
        "--thumb-offset": `${thumbOffsetPct}%`,
      } as CSSProperties);
    };

    update();
    track.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update, { passive: true });

    return () => {
      track.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [trackRef]);

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
    <div className={styles.cue} data-tone={tone} style={thumbStyle}>
      <div className={styles.rail} aria-hidden="true">
        <span className={styles.thumb} />
      </div>
      <button type="button" className={styles.hint} onClick={scrollStep}>
        <span>{label}</span>
        <SiteArrow />
      </button>
    </div>
  );
}
