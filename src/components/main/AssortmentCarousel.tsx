"use client";

import Link from "next/link";
import { useRef } from "react";

import { CatalogImage } from "@/components/catalog/CatalogImage";
import type { TireCatalogModel } from "@/lib/catalog/tireReadModel";

import styles from "./MainHome.module.css";

const DRAG_CLICK_SUPPRESS_PX = 6;

type DragState = {
  pointerId: number | null;
  startX: number;
  scrollLeft: number;
  moved: boolean;
};

export function AssortmentCarousel({ models }: { models: TireCatalogModel[] }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<DragState>({
    pointerId: null,
    startX: 0,
    scrollLeft: 0,
    moved: false,
  });

  if (models.length === 0) return null;

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== "mouse" || event.button !== 0) return;
    const track = trackRef.current;
    if (!track) return;

    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      scrollLeft: track.scrollLeft,
      moved: false,
    };
    track.setPointerCapture(event.pointerId);
    track.dataset.dragging = "true";
  };

  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    const track = trackRef.current;
    if (drag.pointerId !== event.pointerId || !track) return;

    const delta = event.clientX - drag.startX;
    if (Math.abs(delta) > DRAG_CLICK_SUPPRESS_PX) drag.moved = true;
    track.scrollLeft = drag.scrollLeft - delta;
  };

  const endDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    const track = trackRef.current;
    if (drag.pointerId !== event.pointerId || !track) return;

    if (track.hasPointerCapture(event.pointerId)) {
      track.releasePointerCapture(event.pointerId);
    }
    delete track.dataset.dragging;
    drag.pointerId = null;
  };

  const onClickCapture = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!dragRef.current.moved) return;
    event.preventDefault();
    event.stopPropagation();
    dragRef.current.moved = false;
  };

  return (
    <div
      ref={trackRef}
      className={styles.assortmentTrack}
      role="region"
      aria-label="Модели шин"
      tabIndex={0}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onClickCapture={onClickCapture}
    >
      {models.map((model) => {
        const imageUrl = model.imageUrl || model.gallery[0] || null;
        return (
          <Link key={model.id} className={styles.assortmentCard} href={model.href} draggable={false}>
            <span className={styles.assortmentMedia}>
              <CatalogImage
                src={imageUrl}
                alt={model.name}
                fill
                sizes="(max-width: 639px) 88vw, (max-width: 1023px) 48vw, 33vw"
                fallbackKey={model.slug}
              />
            </span>
            <span className={styles.assortmentCardBody}>
              <span className={styles.assortmentStatus}>{model.tireTypeName}</span>
              <strong>{model.name}</strong>
              {model.descriptionShort ? <span>{model.descriptionShort}</span> : null}
            </span>
            <span className={styles.assortmentArrow} aria-hidden="true">
              ↗
            </span>
          </Link>
        );
      })}
    </div>
  );
}
