"use client";

import { useEffect, useRef, useState } from "react";
import type { MediaListItem } from "@/admin/domain/types";
import { browserAdminClient } from "@/admin/client/localStore";
import styles from "./MediaPicker.module.css";

type Props = {
  excludeIds?: string[];
  disabled?: boolean;
  compact?: boolean;
  onSelect: (asset: MediaListItem) => Promise<void> | void;
};

export function MediaPicker({ excludeIds = [], disabled = false, compact = false, onSelect }: Props) {
  const [open, setOpen] = useState(false);
  const [assets, setAssets] = useState<MediaListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showUsed, setShowUsed] = useState(false);
  const [search, setSearch] = useState("");
  const [selectingId, setSelectingId] = useState<string | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      if (typeof dialog.showModal === "function") dialog.showModal();
      else dialog.setAttribute("open", "");
    } else if (!open && dialog.open) {
      if (typeof dialog.close === "function") dialog.close();
      else dialog.removeAttribute("open");
    }
  }, [open]);

  async function showGallery() {
    setOpen(true);
    setError("");
    setLoading(true);
    try {
      setAssets(await browserAdminClient().listAssets());
    } catch {
      setError("Не удалось загрузить галерею. Попробуйте ещё раз.");
    } finally {
      setLoading(false);
    }
  }

  async function select(asset: MediaListItem) {
    setSelectingId(asset.id);
    setError("");
    try {
      await onSelect(asset);
      setOpen(false);
    } catch {
      setError("Не удалось выбрать изображение. Обновите список и попробуйте ещё раз.");
    } finally {
      setSelectingId(null);
    }
  }

  const excluded = new Set(excludeIds);
  const visibleAssets = assets.filter((asset) => {
    if (excluded.has(asset.id) || (!showUsed && asset.usedBy.length > 0)) return false;
    return asset.name.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase());
  });

  return <>
    <button className={`${styles.openButton} ${compact ? styles.compactButton : ""}`} type="button" aria-label={compact ? "Выбрать фото из галереи" : undefined} disabled={disabled} onClick={() => void showGallery()}>
      {compact ? "Выбрать" : "Выбрать из галереи"}
    </button>
    {open ? <dialog
      ref={dialogRef}
      className={styles.dialog}
      aria-labelledby="media-picker-title"
      onClose={() => setOpen(false)}
      onMouseDown={(event) => {
        const bounds = event.currentTarget.getBoundingClientRect();
        if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) setOpen(false);
      }}
    >
        <header className={styles.header}>
          <div><h2 id="media-picker-title">Выбрать изображение</h2><p>Сначала показаны файлы, которые нигде не используются.</p></div>
          <button type="button" className={styles.close} aria-label="Закрыть галерею" onClick={() => setOpen(false)}>×</button>
        </header>
        <div className={styles.filters}>
          <label className={styles.search}>Поиск по имени<input value={search} onChange={(event) => setSearch(event.target.value)} /></label>
          <label className={styles.usedToggle}><input type="checkbox" checked={showUsed} onChange={(event) => setShowUsed(event.target.checked)} />Показывать используемые</label>
        </div>
        {error ? <p role="alert" className={styles.error}>{error}</p> : null}
        {loading ? <p className={styles.status}>Загружаем галерею…</p> : visibleAssets.length === 0 ? <p className={styles.empty}>Подходящих изображений нет.</p> :
          <ul className={styles.grid} aria-label={`Изображения: ${visibleAssets.length}`}>{visibleAssets.map((asset) => <li key={asset.id}>
            <button className={styles.asset} type="button" disabled={selectingId !== null} aria-label={`Выбрать ${asset.name}`} onClick={() => void select(asset)}>
              <img src={asset.dataUrl} alt="" /><strong>{asset.name}</strong><span>{asset.mimeType || "Тип не указан"}</span>
              {asset.usedBy.length > 0 ? <small>Используется: {asset.usedBy.join(", ")}</small> : <small>Нигде не используется</small>}
            </button>
          </li>)}</ul>}
    </dialog> : null}
  </>;
}
