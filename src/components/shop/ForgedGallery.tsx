"use client";

import Image from "next/image";
import { useState } from "react";

import { marketplaceShown } from "@/components/catalog/marketplaceGallery";

import styles from "./ForgedModel.module.css";
import type { ForgedWheelView } from "./forgedView";

export function ForgedGallery({ model }: { model: ForgedWheelView }) {
  const images = model.gallery;
  const [pinned, setPinned] = useState(0);
  const [hovered, setHovered] = useState<number | null>(null);
  if (images.length === 0) return null;
  const shown = marketplaceShown(pinned, hovered);
  const current = images[shown] ?? images[0];
  const canSwitch = images.length > 1;
  function pin(index: number) {
    setPinned(index);
    setHovered(null);
  }

  return (
    <section className={styles.gallery} data-shop-chrome-tone="dark" aria-label={`Виды ${model.name}`}>
      <button
        type="button"
        className={styles.galleryStage}
        disabled={!canSwitch}
        onClick={() => pin(shown)}
        aria-label={canSwitch ? "Закрепить это фото" : current.alt}
      >
        <Image
          src={current.src}
          alt={current.alt || model.name}
          fill
          sizes="(max-width: 760px) 100vw, 90vw"
          priority
        />
      </button>
      {canSwitch ? (
        <div
          className={styles.galleryThumbs}
          aria-label="Фотографии модели"
          onMouseLeave={() => setHovered(null)}
        >
          {images.map((image, index) => (
            <button
              key={image.src}
              type="button"
              className={index === pinned ? styles.galleryThumbActive : undefined}
              aria-label={image.label || `Показать фото ${index + 1}`}
              aria-pressed={index === pinned}
              onMouseEnter={() => setHovered(index)}
              onClick={() => pin(index)}
            >
              <Image src={image.src} alt="" fill sizes="88px" />
            </button>
          ))}
        </div>
      ) : null}
    </section>
  );
}
