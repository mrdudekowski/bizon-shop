"use client";
import { useEffect, useLayoutEffect, useRef, useState, type PointerEvent as ReactPointerEvent, type KeyboardEvent as ReactKeyboardEvent, type ReactNode } from "react";
import type { ImagePlacement, MediaListItem } from "@/admin/domain/types";
import { resolveMediaPreviewUrl } from "@/admin/domain/catalogPreviewUrl";
import { browserAdminClient } from "@/admin/client/localStore";
import { uploadErrorText } from "./uploadError";
import { mediaMimeFromFile } from "./mediaMime";
import styles from "./PlacementFields.module.css";
function emptyPlacement(assetId: string): ImagePlacement { return { assetId, alt: "", focalX: .5, focalY: .5, crop: { x: 0, y: 0, width: 1, height: 1 } }; }
function clamp(value: number) { return Math.min(1, Math.max(0, value)); }
async function uploadImageFile(file: File, current?: ImagePlacement): Promise<ImagePlacement> {
  const upload = {
    name: file.name,
    mimeType: mediaMimeFromFile(file),
    body: file,
  };
  if (current) {
    const replacement = await browserAdminClient().replaceAsset(current.assetId, upload);
    return { ...current, replacementAssetId: replacement.replacementAssetId };
  }
  const asset = await browserAdminClient().createAsset(upload);
  return emptyPlacement(asset.id);
}
function fitCmsPreviewToViewport() {
  const footer = document.querySelector(".documentActions");
  const first = document.querySelector<HTMLElement>("[data-cms-image-fields] [aria-label='Предпросмотр фото и точки фокуса']");
  if (!(footer instanceof HTMLElement) || !first?.getClientRects().length) return;
  const fields = first.closest("[data-cms-image-fields]");
  const room = Math.floor(footer.getBoundingClientRect().top - first.getBoundingClientRect().top - 8);
  const widthCap = Math.floor(fields?.getBoundingClientRect().width ?? window.innerWidth);
  document.documentElement.style.setProperty("--cms-preview-max", `${Math.max(72, Math.min(room, widthCap, Math.round(window.innerHeight - 220)))}px`);
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
  const [uploading, setUploading] = useState(false);
  const [replacementPending, setReplacementPending] = useState(false);
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
    void browserAdminClient().listAssets().then((assets: MediaListItem[]) => {
      if (cancelled) return;
      const asset = assets.find((item) => item.id === assetId);
      setPreviewUrl(resolveMediaPreviewUrl(asset?.dataUrl));
      setReplacementPending(Boolean(asset?.replacementPending));
    });
    return () => { cancelled = true; };
  }, [assetId]);
  useLayoutEffect(() => {
    if (!previewUrl) return;
    const node = frame.current;
    if (!node) return;
    const fit = () => fitCmsPreviewToViewport();
    fit();
    const raf = requestAnimationFrame(fit);
    const observer = new ResizeObserver(fit);
    const panel = node.closest("[data-document-tab-panel]");
    if (panel) observer.observe(panel);
    window.addEventListener("resize", fit);
    return () => {
      cancelAnimationFrame(raf);
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
    setUploading(true);
    try {
      const placement = await uploadImageFile(file, value);
      setPreviewUrl(URL.createObjectURL(file));
      if (value) setReplacementPending(true);
      onChange(placement);
    } catch (error) {
      setUploadError(uploadErrorText(error));
    } finally {
      setUploading(false);
    }
  }
  async function cancelReplacement() {
    if (!assetId || !value) return;
    setUploadError("");
    setUploading(true);
    try {
      await browserAdminClient().cancelAssetReplacement(assetId);
      setReplacementPending(false);
      const next = { ...value };
      delete next.replacementAssetId;
      onChange(next);
      const assets = await browserAdminClient().listAssets();
      setPreviewUrl(resolveMediaPreviewUrl(assets.find((asset) => asset.id === assetId)?.dataUrl));
    } catch (error) {
      setUploadError(uploadErrorText(error));
    } finally {
      setUploading(false);
    }
  }
  function patch(next: Partial<ImagePlacement>) { if (value) onChange({ ...value, ...next }); }
  function pointAt(event: ReactPointerEvent) {
    if (!showFocus || !value || !frame.current) return;
    const bounds = frame.current.getBoundingClientRect();
    patch({ focalX: clamp((event.clientX - bounds.left) / bounds.width), focalY: clamp((event.clientY - bounds.top) / bounds.height) });
  }
  function dragFocus(event: ReactPointerEvent<HTMLButtonElement>) {
    if (!showFocus || !value) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    pointAt(event);
  }
  function moveDrag(event: ReactPointerEvent<HTMLButtonElement>) {
    if (!event.currentTarget.hasPointerCapture(event.pointerId)) return;
    pointAt(event);
  }
  function moveFocus(event: ReactKeyboardEvent<HTMLButtonElement>) {
    if (!value) return;
    const step = event.shiftKey ? .05 : .01;
    const delta = ({ ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] } as const)[event.key as "ArrowLeft" | "ArrowRight" | "ArrowUp" | "ArrowDown"];
    if (delta) { event.preventDefault(); patch({ focalX: clamp(value.focalX + delta[0]), focalY: clamp(value.focalY + delta[1]) }); }
  }
  const placementStyle = value ? ({ "--focus-x": `${value.focalX * 100}%`, "--focus-y": `${value.focalY * 100}%` } as React.CSSProperties) : undefined;
  const displayUrl = previewSrc || previewUrl;
  const replaceLabel = (
    <label className={styles.filePick}>
      {uploading ? "Загружаем…" : value ? "Заменить фото" : "Загрузить фото"}
      <input
        aria-label={`${label}: файл`}
        type="file"
        accept="image/*"
        disabled={uploading}
        onChange={(event) => {
          void onFile(event.target.files?.[0]);
          event.target.value = "";
        }}
      />
    </label>
  );
  return <fieldset className={styles.fields} data-cms-image-fields><legend>{label}</legend>
    {displayUrl ? null : replaceLabel}
    {uploadError ? <p role="alert">{uploadError}</p> : null}
    {displayUrl ? (
      <>
        {thumbs}
        <div className={styles.stage}>
          <div className={styles.previewColumn}>
            <div className={styles.previewFrame}>
              <div ref={frame} className={styles.previewShot} style={showFocus ? placementStyle : undefined} aria-label="Предпросмотр фото и точки фокуса">
                <img className={styles.preview} src={displayUrl} alt={value?.alt || label} />
                {showFocus && value ? <button className={styles.focusPoint} style={placementStyle} type="button" aria-label="Точка фокуса: перетащите кружок; стрелки на клавиатуре" onPointerDown={dragFocus} onPointerMove={moveDrag} onKeyDown={moveFocus} /> : null}
              </div>
            </div>
          </div>
          {value ? (
            <div className={styles.controls}>
              {replaceLabel}
              {replacementPending ? <>
                <p className={styles.caption}>Новое фото появится на сайте после публикации.</p>
                <button type="button" className="ghost" disabled={uploading} onClick={() => void cancelReplacement()}>
                  Отменить замену
                </button>
              </> : null}
              {showFocus ? <p className={styles.caption}>Перетащите кружок, чтобы сдвинуть кадр на карточке.</p> : null}
              <label>Подпись к фото<input value={value.alt} onChange={(event) => patch({ alt: event.target.value })} /></label>
              <button type="button" className="ghost" onClick={() => { onChange(undefined); setPreviewUrl(null); }}>Убрать фото</button>
            </div>
          ) : null}
        </div>
      </>
    ) : null}
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
  const [uploading, setUploading] = useState(false);
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
    setUploading(true);
    try {
      const added: ImagePlacement[] = [];
      for (const file of Array.from(files)) added.push(await uploadImageFile(file));
      onGalleryChange([...photos, ...added]);
    } catch (error) {
      setUploadError(uploadErrorText(error));
    } finally {
      setUploading(false);
    }
  }
  const addPhoto = (
    <label className={styles.thumbAdd}>
      {uploading ? "Загружаем…" : "Добавить фото"}
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
  );
  return (
    <div className={styles.productPhotos}>
      <PlacementFields
        label={pinned === 0 ? "Главное фото" : `Фото ${pinned}`}
        value={pinnedPlacement}
        onChange={onPinnedChange}
        previewSrc={shown === pinned ? undefined : shownUrl}
        showFocus={shown === pinned && Boolean(pinnedPlacement)}
        thumbs={
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
            {addPhoto}
          </div>
        }
      />
      {uploadError ? <p role="alert">{uploadError}</p> : null}
    </div>
  );
}
