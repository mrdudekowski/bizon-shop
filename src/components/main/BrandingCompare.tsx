"use client";

import Image from "next/image";
import { useRef, useState, type CSSProperties, type PointerEvent } from "react";

import { PREMIUM_MEDIA } from "@/constants/images";

import { splitPercent } from "./brandingSplit";
import styles from "./MainHome.module.css";

export function BrandingCompare() {
  const rootRef = useRef<HTMLDivElement>(null);
  const rangeRef = useRef<HTMLInputElement>(null);
  const [split, setSplit] = useState(50);

  function seek(clientX: number) {
    const rect = rootRef.current?.getBoundingClientRect();
    if (!rect) return;
    setSplit(splitPercent(clientX, rect.left, rect.width));
  }

  function onPointerDown(event: PointerEvent<HTMLDivElement>) {
    event.currentTarget.setPointerCapture(event.pointerId);
    rangeRef.current?.focus();
    seek(event.clientX);
  }

  function onPointerMove(event: PointerEvent<HTMLDivElement>) {
    if (!event.currentTarget.hasPointerCapture(event.pointerId)) return;
    seek(event.clientX);
  }

  return (
    <div
      ref={rootRef}
      className={styles.brandingCompare}
      style={{ "--split": `${split}%` } as CSSProperties}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
    >
      <div className={styles.brandingLayer} aria-hidden="true">
        <Image
          src={PREMIUM_MEDIA.brandingTirePlain}
          alt=""
          fill
          sizes="100vw"
        />
      </div>
      <div className={styles.brandingLayerAfter} aria-hidden="true">
        <Image
          src={PREMIUM_MEDIA.brandingTireBranded}
          alt=""
          fill
          sizes="100vw"
        />
      </div>
      <div className={styles.brandingHandle} aria-hidden="true">
        <span className={styles.brandingHandleKnob}>
          <svg viewBox="0 0 40 40">
            <path d="M15 13 9 20l6 7" />
            <path d="M25 13 31 20l-6 7" />
          </svg>
        </span>
      </div>
      <input
        ref={rangeRef}
        className={styles.brandingRange}
        type="range"
        min={0}
        max={100}
        value={split}
        aria-label="Сравнение до и после брендирования"
        onChange={(event) => setSplit(Number(event.currentTarget.value))}
      />
    </div>
  );
}
