"use client";

import { SiteArrow } from "@/components/SiteArrow/SiteArrow";

import styles from "./HorizontalScrollCue.module.css";

type HorizontalScrollCueProps = {
  count: number;
  activeIndex: number;
  onStep: (direction: -1 | 1) => void;
  tone?: "light" | "dark";
  label?: string;
};

export function HorizontalScrollCue({
  count,
  activeIndex,
  onStep,
  tone = "light",
  label = "Листайте",
}: HorizontalScrollCueProps) {
  return (
    <div className={styles.cue} data-tone={tone}>
      <div className={styles.rail} aria-hidden="true">
        {Array.from({ length: count }, (_, index) => (
          <span key={index} className={styles.segment} data-active={index === activeIndex ? "true" : "false"} />
        ))}
      </div>
      <button type="button" className={styles.hint} onClick={() => onStep(1)} aria-label="Следующая карточка">
        <span>{label}</span>
        <SiteArrow />
      </button>
    </div>
  );
}
