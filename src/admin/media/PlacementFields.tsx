"use client";
import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent, type KeyboardEvent as ReactKeyboardEvent } from "react";
import Image from "next/image";
import type { ImagePlacement, MediaListItem } from "@/admin/domain/types";
import { browserAdminClient } from "@/admin/client/localStore";
import styles from "./PlacementFields.module.css";
function readFile(file: File): Promise<string> { return new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = () => reject(reader.error); reader.readAsDataURL(file); }); }
function emptyPlacement(assetId: string): ImagePlacement { return { assetId, alt: "", focalX: .5, focalY: .5, crop: { x: 0, y: 0, width: 1, height: 1 } }; }
function clamp(value: number) { return Math.min(1, Math.max(0, value)); }
function number(raw: string, fallback: number) { const parsed = Number(raw); return Number.isFinite(parsed) ? clamp(parsed) : fallback; }
type Props = { value: ImagePlacement | undefined; onChange: (value: ImagePlacement | undefined) => void; label?: string };
export function PlacementFields({ value, onChange, label = "Фото" }: Props) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState("");
  const frame = useRef<HTMLDivElement>(null);
  const assetId = value?.assetId;
  useEffect(() => {
    if (!assetId) { setPreviewUrl(null); return; }
    let cancelled = false;
    void browserAdminClient().listAssets().then((assets: MediaListItem[]) => { if (!cancelled) setPreviewUrl(assets.find((asset) => asset.id === assetId)?.dataUrl ?? null); });
    return () => { cancelled = true; };
  }, [assetId]);
  async function onFile(file?: File) {
    if (!file) return;
    setUploadError("");
    try {
      const dataUrl = await readFile(file);
      const asset = await browserAdminClient().createAsset({ name: file.name, mimeType: file.type || "image/*", dataUrl });
      setPreviewUrl(dataUrl);
      onChange(emptyPlacement(asset.id));
    } catch { setUploadError("Не удалось загрузить фото. Попробуйте другой файл."); }
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
    if (!value || !frame.current) return;
    const bounds = frame.current.getBoundingClientRect();
    patch({ focalX: clamp((event.clientX - bounds.left) / bounds.width), focalY: clamp((event.clientY - bounds.top) / bounds.height) });
  }
  function moveFocus(event: ReactKeyboardEvent<HTMLButtonElement>) {
    if (!value) return;
    const step = event.shiftKey ? .05 : .01;
    const delta = ({ ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] } as const)[event.key as "ArrowLeft" | "ArrowRight" | "ArrowUp" | "ArrowDown"];
    if (delta) { event.preventDefault(); patch({ focalX: clamp(value.focalX + delta[0]), focalY: clamp(value.focalY + delta[1]) }); }
  }
  const placementStyle = value ? ({ "--crop-x": `${value.crop.x * 100}%`, "--crop-y": `${value.crop.y * 100}%`, "--crop-w": `${value.crop.width * 100}%`, "--crop-h": `${value.crop.height * 100}%`, "--focus-x": `${value.focalX * 100}%`, "--focus-y": `${value.focalY * 100}%` } as React.CSSProperties) : undefined;
  return <fieldset className={styles.fields}><legend>{label}</legend>
    <label>Загрузить фото<input aria-label={`${label}: файл`} type="file" accept="image/*" onChange={(event) => void onFile(event.target.files?.[0])} /></label>
    {uploadError ? <p role="alert">{uploadError}</p> : null}
    {previewUrl && value ? <>
      <div ref={frame} className={styles.previewFrame} style={placementStyle} onPointerDown={pointAt} aria-label="Предпросмотр кадра и точки фокуса">
        <Image className={styles.preview} src={previewUrl} width={960} height={540} unoptimized alt={value.alt || label} />
        <div className={styles.cropOverlay} /><div className={styles.cropRect} />
        <button className={styles.focusPoint} style={placementStyle} type="button" aria-label="Точка фокуса: перемещайте стрелками; Shift со стрелкой — крупный шаг" onPointerDown={(event) => event.stopPropagation()} onKeyDown={moveFocus} />
      </div>
      <p className={styles.caption}>Нажмите на фото, чтобы указать фокус. Перемещайте точку стрелками; рамка показывает сохраняемый кадр.</p>
      <label>Подпись к фото<input value={value.alt} onChange={(event) => patch({ alt: event.target.value })} /></label>
      <div className={styles.numbers}>
        <label>Рамка: левый край<input type="number" min="0" max="1" step=".01" value={value.crop.x} onChange={(event) => patchCrop({ x: number(event.target.value, value.crop.x) })} /></label>
        <label>Рамка: верхний край<input type="number" min="0" max="1" step=".01" value={value.crop.y} onChange={(event) => patchCrop({ y: number(event.target.value, value.crop.y) })} /></label>
        <label>Рамка: ширина<input type="number" min="0" max="1" step=".01" value={value.crop.width} onChange={(event) => patchCrop({ width: number(event.target.value, value.crop.width) })} /></label>
        <label>Рамка: высота<input type="number" min="0" max="1" step=".01" value={value.crop.height} onChange={(event) => patchCrop({ height: number(event.target.value, value.crop.height) })} /></label>
      </div>
      <button type="button" className="ghost" onClick={() => { onChange(undefined); setPreviewUrl(null); }}>Убрать фото</button>
    </> : null}
  </fieldset>;
}


