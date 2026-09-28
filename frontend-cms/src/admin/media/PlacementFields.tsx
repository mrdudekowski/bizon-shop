"use client";
import { useEffect, useLayoutEffect, useRef, useState, type PointerEvent as ReactPointerEvent, type KeyboardEvent as ReactKeyboardEvent, type ReactNode } from "react";
import type { ImagePlacement, MediaListItem } from "@/admin/domain/types";
import { resolveMediaPreviewUrl } from "@/admin/domain/catalogPreviewUrl";
import { AdminClientError } from "@/admin/client/errors";
import { browserAdminClient } from "@/admin/client/localStore";
import styles from "./PlacementFields.module.css";
function emptyPlacement(assetId: string): ImagePlacement { return { assetId, alt: "", focalX: .5, focalY: .5, crop: { x: 0, y: 0, width: 1, height: 1 } }; }
function clamp(value: number) { return Math.min(1, Math.max(0, value)); }
function number(raw: string, fallback: number) { const parsed = Number(raw); return Number.isFinite(parsed) ? clamp(parsed) : fallback; }
async function uploadImageFile(file: File): Promise<ImagePlacement> {
  const asset = await browserAdminClient().createAsset({
    name: file.name,
    mimeType: file.type || "image/png",
    body: file,
  });
  return emptyPlacement(asset.id);
}
function uploadErrorText(error: unknown): string {
  return error instanceof AdminClientError && error.code === "storage_unavailable"
    ? "Хранилище S3 не настроено. Добавьте ключи бакета и повторите загрузку."
    : "Не удалось загрузить фото. Попробуйте другой файл.";
}
function fitCmsPreviewToViewport() {
  const footer = document.querySelector(".documentActions");
  const first = document.querySelector<HTMLElement>("[data-cms-image-fields] [aria-label='Предпросмотр фото и точки фокуса']");
  if (!(footer instanceof HTMLElement) || !first?.getClientRects().length) return;
  const room = Math.floor(footer.getBoundingClientRect().top - first.getBoundingClientRect().top - 8);
  document.documentElement.style.setProperty("--cms-preview-max", `${Math.max(160, Math.min(room, Math.round(window.innerHeight - 160)))}px`);
}
type Props = {
  value: ImagePlacement | undefined;
  onChange: (value: ImagePlacement | undefined) => void;
  label?: string;
  thumbs?: ReactNode;
  previewSrc?: string | null;
  showFocus?: boolean;
};
export function PlacementFields({ value, onChange, label = "Фото", thumbs, previewSrc, showFocus = true }: Props) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState("");
  const frame = useRef<HTMLDivElement>(null);
  const assetId = value?.assetId;
  useEffect(() => {
    return () => {
      if (previewUrl?.startsWith("blob:")) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);
  useEffect(() => {
    if (!assetId) { setPreviewUrl(null); return; }
    let cancelled = false;
    void browserAdminClient().listAssets().then((assets: MediaListItem[]) => { if (!cancelled) setPreviewUrl(resolveMediaPreviewUrl(assets.find((asset) => asset.id === assetId)?.dataUrl)); });
    return () => { cancelled = true; };
  }, [assetId]);
  useLayoutEffect(() => {
    if (!previewUrl) return;
    const node = frame.current;
    if (!node) return;
    const fit = () => fitCmsPreviewToViewport();
    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(node);
    window.addEventListener("resize", fit);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", fit);
      queueMicrotask(() => {
        if (!document.querySelector("[data-cms-image-fields]")) document.documentElement.style.removeProperty("--cms-preview-max");
      });
    };
  }, [previewUrl]);
  async function onFile(file?: File) {
    if (!file) return;
    setUploadError("");
    try {
      const placement = await uploadImageFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      onChange(placement);
    } catch (error) {
      setUploadError(uploadErrorText(error));
    }
  }
  function patch(next: Partial<ImagePlacement>) { if (value) onChange({ ...value, ...next }); }
  function patchCrop(next: Partial<ImagePlacement["crop"]>) {
    if (!value) return;
    const crop = { ...value.crop, ...next };
    crop.width = Math.min(1, Math.max(.01, crop.width));
    crop.height = Math.min(1, Math.max(.01, crop.height));
    crop.x = Math.min(Math.max(0, crop.x), 1 - crop.width);
    crop.y = Math.min(Math.max(0, crop.y), 1 - crop.height);
    onChange({ ...value, crop });
  }
  function pointAt(event: ReactPointerEvent<HTMLDivElement>) {
    if (!showFocus || !value || !frame.current) return;
    const bounds = frame.current.getBoundingClientRect();
    patch({ focalX: clamp((event.clientX - bounds.left) / bounds.width), focalY: clamp((event.clientY - bounds.top) / bounds.height) });
  }
  function moveFocus(event: ReactKeyboardEvent<HTMLButtonElement>) {
    if (!value) return;
    const step = event.shiftKey ? .05 : .01;
    const delta = ({ ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] } as const)[event.key as "ArrowLeft" | "ArrowRight" | "ArrowUp" | "ArrowDown"];
    if (delta) { event.preventDefault(); patch({ focalX: clamp(value.focalX + delta[0]), focalY: clamp(value.focalY + delta[1]) }); }
  }
  const placementStyle = value ? ({ "--focus-x": `${value.focalX * 100}%`, "--focus-y": `${value.focalY * 100}%` } as React.CSSProperties) : undefined;
  const displayUrl = previewSrc || previewUrl;
  return <fieldset className={styles.fields} data-cms-image-fields><legend>{label}</legend>
    {displayUrl ? null : <label>{value ? "Заменить фото" : "Загрузить фото"}<input aria-label={`${label}: файл`} type="file" accept="image/*" onChange={(event) => void onFile(event.target.files?.[0])} /></label>}
    {uploadError ? <p role="alert">{uploadError}</p> : null}
    {displayUrl ? (
      <div className={styles.previewFrame}>
        <div ref={frame} className={styles.previewShot} style={showFocus ? placementStyle : undefined} onPointerDown={pointAt} aria-label="Предпросмотр фото и точки фокуса">
          <img className={styles.preview} src={displayUrl} alt={value?.alt || label} />
          {showFocus && value ? <button className={styles.focusPoint} style={placementStyle} type="button" aria-label="Точка фокуса: перемещайте стрелками; Shift со стрелкой — крупный шаг" onPointerDown={(event) => event.stopPropagation()} onKeyDown={moveFocus} /> : null}
        </div>
      </div>
    ) : null}
    {thumbs}
    {displayUrl ? <label>{value ? "Заменить фото" : "Загрузить фото"}<input aria-label={`${label}: файл`} type="file" accept="image/*" onChange={(event) => void onFile(event.target.files?.[0])} /></label> : null}
    {value && displayUrl ? <>
      {showFocus ? <p className={styles.caption}>Нажмите на фото, чтобы указать фокус. Перемещайте точку стрелками.</p> : null}
      <label>Подпись к фото<input value={value.alt} onChange={(event) => patch({ alt: event.target.value })} /></label>
      <details className={styles.cropDetails}>
        <summary>Точная настройка кадрирования</summary>
        <div className={styles.numbers}>
          <label>Рамка: левый край<input type="number" min="0" max="1" step=".01" value={value.crop.x} onChange={(event) => patchCrop({ x: number(event.target.value, value.crop.x) })} /></label>
          <label>Рамка: верхний край<input type="number" min="0" max="1" step=".01" value={value.crop.y} onChange={(event) => patchCrop({ y: number(event.target.value, value.crop.y) })} /></label>
          <label>Рамка: ширина<input type="number" min="0" max="1" step=".01" value={value.crop.width} onChange={(event) => patchCrop({ width: number(event.target.value, value.crop.width) })} /></label>
          <label>Рамка: высота<input type="number" min="0" max="1" step=".01" value={value.crop.height} onChange={(event) => patchCrop({ height: number(event.target.value, value.crop.height) })} /></label>
        </div>
      </details>
      <button type="button" className="ghost" onClick={() => { onChange(undefined); setPreviewUrl(null); }}>Убрать фото</button>
    </> : null}
  </fieldset>;
}

export function ProductPhotoFields({
  cover,
  gallery,
  onCoverChange,
  onGalleryChange,
}: {
  cover: ImagePlacement | undefined;
  gallery: ImagePlacement[] | undefined;
  onCoverChange: (value: ImagePlacement | undefined) => void;
  onGalleryChange: (value: ImagePlacement[]) => void;
}) {
  const photos = gallery ?? [];
  const slots = [cover, ...photos];
  const [pinned, setPinned] = useState(0);
  const [hovered, setHovered] = useState<number | null>(null);
  const [urls, setUrls] = useState<Record<string, string>>({});
  const [uploadError, setUploadError] = useState("");
  const assetKey = slots.map((slot) => slot?.assetId ?? "").join(",");
  useEffect(() => {
    let cancelled = false;
    void browserAdminClient().listAssets().then((assets: MediaListItem[]) => {
      if (cancelled) return;
      const next: Record<string, string> = {};
      for (const asset of assets) {
        const url = resolveMediaPreviewUrl(asset.dataUrl);
        if (url) next[asset.id] = url;
      }
      setUrls(next);
    });
    return () => { cancelled = true; };
  }, [assetKey]);
  useEffect(() => {
    setPinned((current) => Math.min(current, Math.max(0, slots.length - 1)));
    setHovered(null);
  }, [slots.length]);
  const shown = hovered ?? pinned;
  const pinnedPlacement = slots[pinned];
  const shownPlacement = slots[shown];
  const shownUrl = shownPlacement ? urls[shownPlacement.assetId] : null;
  function pin(index: number) {
    setPinned(index);
    setHovered(null);
  }
  function onPinnedChange(next: ImagePlacement | undefined) {
    if (pinned === 0) onCoverChange(next);
    else if (!next) {
      onGalleryChange(photos.filter((_, index) => index !== pinned - 1));
      setPinned(0);
    } else {
      onGalleryChange(photos.map((photo, index) => (index === pinned - 1 ? next : photo)));
    }
  }
  async function onFiles(files: FileList | null) {
    if (!files?.length) return;
    setUploadError("");
    try {
      const added: ImagePlacement[] = [];
      for (const file of Array.from(files)) added.push(await uploadImageFile(file));
      onGalleryChange([...photos, ...added]);
    } catch (error) {
      setUploadError(uploadErrorText(error));
    }
  }
  return (
    <div className={styles.productPhotos}>
      <PlacementFields
        label={pinned === 0 ? "Главное фото" : `Фото ${pinned}`}
        value={pinnedPlacement}
        onChange={onPinnedChange}
        previewSrc={shown === pinned ? undefined : shownUrl}
        showFocus={shown === pinned && Boolean(pinnedPlacement)}
        thumbs={slots.length > 1 ? (
          <div className={styles.thumbs} aria-label="Фотографии товара" onMouseLeave={() => setHovered(null)}>
            {slots.map((slot, index) => (
              <button
                key={slot?.assetId ?? `empty-${index}`}
                type="button"
                className={index === pinned ? styles.thumbActive : undefined}
                aria-pressed={index === pinned}
                aria-label={index === 0 ? "Главное фото" : `Фото ${index}`}
                onMouseEnter={() => setHovered(index)}
                onClick={() => pin(index)}
              >
                {slot && urls[slot.assetId] ? <img src={urls[slot.assetId]} alt="" /> : <span>{index === 0 ? "Главное" : index}</span>}
              </button>
            ))}
          </div>
        ) : null}
      />
      <label>
        Добавить фото
        <input
          aria-label="Фотографии товара: файлы"
          type="file"
          accept="image/*"
          multiple
          onChange={(event) => {
            void onFiles(event.target.files);
            event.target.value = "";
          }}
        />
      </label>
      {uploadError ? <p role="alert">{uploadError}</p> : null}
    </div>
  );
}
