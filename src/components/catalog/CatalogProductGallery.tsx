"use client";

import { useRef, useState, type PointerEvent } from "react";

import { CatalogImage } from "@/components/catalog/CatalogImage";
import { marketplaceShown } from "@/components/catalog/marketplaceGallery";

import styles from "./TireCatalog.module.css";

type CatalogProductGalleryProps = {
  images: string[];
  alt: string;
  fallbackKey: string;
  applications?: { name: string; icon: string }[];
};

export function CatalogProductGallery({
  images,
  alt,
  fallbackKey,
  applications = [],
}: CatalogProductGalleryProps) {
  const [pinned, setPinned] = useState(0);
  const [hovered, setHovered] = useState<number | null>(null);
  const swipeStart = useRef<number | null>(null);
  const didSwipe = useRef(false);
  const shown = marketplaceShown(pinned, hovered);
  const current = images[shown] ?? images[0];
  const canSwitch = images.length > 1;

  function pin(index: number) {
    setPinned(index);
    setHovered(null);
  }

  function onPointerDown(event: PointerEvent<HTMLButtonElement>) {
    if (!canSwitch) return;
    swipeStart.current = event.clientX;
    didSwipe.current = false;
  }

  function onPointerUp(event: PointerEvent<HTMLButtonElement>) {
    if (swipeStart.current == null || !canSwitch) return;
    const delta = event.clientX - swipeStart.current;
    swipeStart.current = null;
    if (Math.abs(delta) < 40) return;
    didSwipe.current = true;
    pin((pinned + (delta < 0 ? 1 : -1) + images.length) % images.length);
  }

  return (
    <div className={styles.productGallery}>
      <div className={styles.productShot}>
        <button
          type="button"
          className={styles.productMedia}
          disabled={!canSwitch}
          onPointerDown={onPointerDown}
          onPointerUp={onPointerUp}
          onClick={() => {
            if (didSwipe.current) { didSwipe.current = false; return; }
            pin(shown);
          }}
          aria-label={canSwitch ? "Закрепить это фото" : alt}
        >
          <CatalogImage
            src={current}
            fallbackKey={fallbackKey}
            alt={alt}
            fill
            priority
            sizes="(max-width: 899px) 100vw, 58vw"
          />
        </button>
        {applications.length > 0 ? (
          <ul className={styles.applicationBadges} aria-label="Применение">
            {applications.map((application) => (
              <li key={application.icon}>
                <img src={application.icon} alt={application.name} width={48} height={48} />
              </li>
            ))}
          </ul>
        ) : null}
      </div>
      {canSwitch ? (
        <div
          className={styles.productThumbs}
          aria-label="Фотографии товара"
          onMouseLeave={() => setHovered(null)}
        >
          {images.map((url, index) => (
            <button
              key={url}
              type="button"
              className={index === pinned ? styles.productThumbActive : undefined}
              aria-label={`Показать фото ${index + 1}`}
              aria-pressed={index === pinned}
              onMouseEnter={() => setHovered(index)}
              onClick={() => pin(index)}
            >
              <CatalogImage src={url} fallbackKey={fallbackKey} alt="" fill sizes="88px" />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
