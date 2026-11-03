"use client";

import { useLayoutEffect, useRef, useState, type ReactNode, type TouchEvent } from "react";

import { carouselSwipeStep } from "./carouselSwipe";
import { HorizontalScrollCue } from "./HorizontalScrollCue";
import { loopSlot, wrapIndex } from "./loopIndex";
import styles from "./LoopedStrip.module.css";

type LoopedStripProps = {
  count: number;
  label: string;
  tone?: "light" | "dark";
  className?: string;
  children: (index: number) => ReactNode;
};

export function LoopedStrip({ count, label, tone = "light", className, children }: LoopedStripProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const viewportRef = useRef<HTMLDivElement>(null);
  const previousSlots = useRef<number[]>([]);
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const restoreFocus = useRef(false);
  const slots = Array.from({ length: count }, (_, index) => loopSlot(index, activeIndex, count));
  const jumped = slots.map((slot, index) => {
    const previous = previousSlots.current[index];
    return previous !== undefined && Math.abs(slot - previous) > 1;
  });

  useLayoutEffect(() => {
    previousSlots.current = Array.from({ length: count }, (_, index) => loopSlot(index, activeIndex, count));
    if (!restoreFocus.current) return;
    restoreFocus.current = false;
    viewportRef.current?.querySelector<HTMLElement>('[data-slot="0"] a')?.focus({ preventScroll: true });
  }, [activeIndex, count]);

  if (count < 1) return null;

  function step(direction: -1 | 1) {
    if (count < 2) return;
    setActiveIndex((current) => wrapIndex(current + direction, count));
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
    event.preventDefault();
    restoreFocus.current = true;
    step(event.key === "ArrowRight" ? 1 : -1);
  }

  function onTouchStart(event: TouchEvent<HTMLDivElement>) {
    const touch = event.touches[0];
    touchStart.current = touch ? { x: touch.clientX, y: touch.clientY } : null;
  }

  function onTouchEnd(event: TouchEvent<HTMLDivElement>) {
    const start = touchStart.current;
    touchStart.current = null;
    const end = event.changedTouches[0];
    if (!start || !end) return;
    const swipe = carouselSwipeStep(end.clientX - start.x, end.clientY - start.y);
    if (swipe !== 0) step(swipe);
  }

  return (
    <div className={[styles.root, className].filter(Boolean).join(" ")}>
      <div
        ref={viewportRef}
        className={styles.viewport}
        role="region"
        aria-roledescription="carousel"
        aria-label={label}
        onKeyDown={onKeyDown}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {slots.map((slot, index) => (
          <div
            key={index}
            className={styles.item}
            style={{ "--slot": slot } as React.CSSProperties}
            data-slot={slot}
            data-jump={jumped[index] ? "true" : "false"}
            aria-hidden={slot === 0 ? undefined : true}
            inert={slot === 0 ? undefined : true}
          >
            {children(index)}
          </div>
        ))}
      </div>
      {count > 1 ? (
        <HorizontalScrollCue count={count} activeIndex={wrapIndex(activeIndex, count)} onStep={step} tone={tone} />
      ) : null}
    </div>
  );
}
