"use client";
import { useEffect, useId, useLayoutEffect, useRef, useState, type PointerEvent as ReactPointerEvent, type KeyboardEvent as ReactKeyboardEvent, type DragEvent, type ReactNode } from "react";
import type { FocalPoint, FocalViewport, ImagePlacement, MediaListItem } from "@/admin/domain/types";
import { FOCAL_VIEWPORTS } from "@/admin/domain/types";
import { resolveFocalPoint, setFocalPoint } from "@/admin/domain/focalPosition";
import { resolveMediaPreviewUrl } from "@/admin/domain/catalogPreviewUrl";
import { browserAdminClient } from "@/admin/client/localStore";
import { MediaPicker } from "./MediaPicker";
import { uploadErrorText } from "./uploadError";
import { AdminClientError } from "@/admin/client/errors";
import { mediaMimeFromFile } from "./mediaMime";
import { IMAGE_UPLOAD_TYPES, acceptAttribute, firstAllowedFile, uploadLibraryFile } from "./uploadLibraryFile";
import { focalObjectPosition, pageHeroFrameGeometry, previewAspectRatio, type PageHeroPreview, type PageImageFrame } from "@/admin/pages/pageImageFrame";
import { pageHeroReferenceViewport } from "@/admin/pages/pageHeroPreviewGeometry";
import { pageHeroImageDragPosition } from "@/admin/pages/pageHeroImageDrag";
import frameStyles from "@/admin/pages/pageImageFrame.module.css";
import styles from "./PlacementFields.module.css";
function emptyPlacement(assetId: string): ImagePlacement { return { assetId, alt: "", focalX: .5, focalY: .5, crop: { x: 0, y: 0, width: 1, height: 1 } }; }
function clamp(value: number) { return Math.min(1, Math.max(0, value)); }
function ViewportIcon({ viewport }: { viewport: FocalViewport }) {
  if (viewport === "desktop") return <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="4" width="18" height="13" rx="1.8" /><path d="M8 21h8M12 17v4" /></svg>;
  if (viewport === "tablet") return <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="2.5" width="14" height="19" rx="2" /><path d="M11 18.5h2" /></svg>;
  return <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="7" y="2" width="10" height="20" rx="2" /><path d="M11 18.5h2" /></svg>;
}
async function uploadImageFile(file: File, allowedTypes: readonly string[], current?: ImagePlacement): Promise<ImagePlacement> {
  const mimeType = mediaMimeFromFile(file);
  if (!allowedTypes.includes(mimeType)) throw new AdminClientError("publish_blocked");
  const upload = { name: file.name, mimeType, body: file };
  if (current) {
    const replacement = await browserAdminClient().replaceAsset(current.assetId, upload);
    return { ...current, replacementAssetId: replacement.replacementAssetId };
  }
  const asset = await uploadLibraryFile(file, allowedTypes);
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
  value: ImagePlacement | null | undefined;
  onChange: (value: ImagePlacement | undefined) => void;
  label?: string;
  thumbs?: ReactNode;
  previewSrc?: string | null;
  previewSurface?: "default" | "dark";
  uploadMode?: "replace" | "new-asset";
  allowFileDrop?: boolean;
  manageReplacement?: boolean;
  allowedMimeTypes?: readonly string[];
  showFocus?: boolean;
  /** Guest crop. Absent on product, tire, wheel, and file editors, which stay square. */
  frame?: PageImageFrame;
  /** Enables the public geometry and direct dragging for the page-hero frame. */
  pageHeroPreview?: PageHeroPreview;
};

type ImageDrag = {
  pointerId: number;
  clientX: number;
  clientY: number;
  viewport: FocalViewport;
  image: HTMLImageElement;
  src: string;
  current: FocalPoint;
};

export function PlacementFields({ value, onChange, label = "Фото", thumbs, previewSrc, previewSurface = "default", uploadMode = "replace", allowFileDrop = false, manageReplacement = true, allowedMimeTypes = IMAGE_UPLOAD_TYPES, showFocus = true, frame, pageHeroPreview }: Props) {
  const [viewport, setViewport] = useState<FocalViewport>("desktop");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState("");
  const [uploading, setUploading] = useState(false);
  const uploadInProgress = useRef(false);
  const [replacementPending, setReplacementPending] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const imageDrag = useRef<ImageDrag | null>(null);
  const dragInstructionsId = useId();
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
    const node = previewRef.current;
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
    if (!file || uploadInProgress.current) return;
    uploadInProgress.current = true;
    setUploadError("");
    setUploading(true);
    try {
      const replaceExisting = uploadMode === "replace";
      const placement = await uploadImageFile(file, allowedMimeTypes, replaceExisting ? value ?? undefined : undefined);
      setPreviewUrl(URL.createObjectURL(file));
      if (value && replaceExisting) setReplacementPending(true);
      onChange(placement);
    } catch (error) {
      setUploadError(uploadErrorText(error));
    } finally {
      uploadInProgress.current = false;
      setUploading(false);
    }
  }
  function acceptFileDrag(event: DragEvent<HTMLFieldSetElement>) {
    if (event.dataTransfer.types.includes("Files")) event.preventDefault();
  }
  function uploadDroppedFile(event: DragEvent<HTMLFieldSetElement>) {
    if (!event.dataTransfer.files.length) return;
    event.preventDefault();
    if (uploading || uploadInProgress.current) return;
    const file = firstAllowedFile(event.dataTransfer.files, allowedMimeTypes);
    if (file) {
      void onFile(file);
    } else {
      setUploadError(uploadErrorText(new AdminClientError("publish_blocked")));
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
  async function chooseAsset(asset: MediaListItem) {
    if (manageReplacement && replacementPending && assetId) await browserAdminClient().cancelAssetReplacement(assetId);
    const next = value ? { ...value, assetId: asset.id } : emptyPlacement(asset.id);
    delete next.replacementAssetId;
    setReplacementPending(false);
    setPreviewUrl(resolveMediaPreviewUrl(asset.dataUrl));
    onChange(next);
  }
  function patch(next: Partial<ImagePlacement>) { if (value) onChange({ ...value, ...next }); }
  function pointAt(event: ReactPointerEvent) {
    if (!focusEnabled || !value || !previewRef.current) return;
    const bounds = previewRef.current.getBoundingClientRect();
    const point = { x: clamp((event.clientX - bounds.left) / bounds.width), y: clamp((event.clientY - bounds.top) / bounds.height) };
    onChange(setFocalPoint(value, viewport, point));
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
  function startImageDrag(event: ReactPointerEvent<HTMLButtonElement>) {
    const image = imageRef.current;
    if (!value || !image?.naturalWidth || !image.naturalHeight || event.button !== 0) return;
    const drag = imageDrag.current;
    if (drag && event.currentTarget.hasPointerCapture(drag.pointerId)) return;

    event.preventDefault();
    event.currentTarget.focus({ preventScroll: true });
    event.currentTarget.setPointerCapture(event.pointerId);
    imageDrag.current = {
      pointerId: event.pointerId,
      clientX: event.clientX,
      clientY: event.clientY,
      viewport,
      image,
      src: image.src,
      current: activePoint,
    };
  }
  function moveImageDrag(event: ReactPointerEvent<HTMLButtonElement>) {
    const drag = imageDrag.current;
    if (!value || !drag || drag.pointerId !== event.pointerId || drag.viewport !== viewport
      || drag.image !== imageRef.current || drag.src !== drag.image.src
      || !event.currentTarget.hasPointerCapture(event.pointerId)) return;

    const { width, height } = drag.image.getBoundingClientRect();
    const next = pageHeroImageDragPosition({
      current: drag.current,
      deltaX: event.clientX - drag.clientX,
      deltaY: event.clientY - drag.clientY,
      frameWidth: width,
      frameHeight: height,
      naturalWidth: drag.image.naturalWidth,
      naturalHeight: drag.image.naturalHeight,
    });
    imageDrag.current = { ...drag, current: next, clientX: event.clientX, clientY: event.clientY };
    if (next.x !== drag.current.x || next.y !== drag.current.y) {
      onChange(setFocalPoint(value, viewport, next));
    }
  }
  function endImageDrag(event: ReactPointerEvent<HTMLButtonElement>) {
    if (imageDrag.current?.pointerId === event.pointerId) imageDrag.current = null;
  }
  function moveFocus(event: ReactKeyboardEvent<HTMLButtonElement>) {
    if (!value) return;
    const step = (event.shiftKey ? .05 : .01) * (pageHeroGeometry ? -1 : 1);
    const delta = ({ ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] } as const)[event.key as "ArrowLeft" | "ArrowRight" | "ArrowUp" | "ArrowDown"];
    if (delta) {
      event.preventDefault();
      if (pageHeroGeometry) {
        const image = imageRef.current;
        const { width, height } = previewRef.current?.getBoundingClientRect() ?? { width: 0, height: 0 };
        const imageRatio = image?.naturalWidth && image.naturalHeight ? image.naturalWidth / image.naturalHeight : 0;
        const frameRatio = width > 0 && height > 0 ? width / height : 0;
        const hasOverflowOnAxis = delta[0] !== 0 ? imageRatio > frameRatio : imageRatio < frameRatio;
        if (imageRatio > 0 && frameRatio > 0 && !hasOverflowOnAxis) return;
      }
      const current = resolveFocalPoint(value, viewport);
      onChange(setFocalPoint(value, viewport, { x: clamp(current.x + delta[0]), y: clamp(current.y + delta[1]) }));
    }
  }
  const focusEnabled = showFocus && frame?.usesFocal !== false;
  const activePoint = value ? resolveFocalPoint(value, viewport) : { x: 0.5, y: 0.5 };
  const placementStyle = value ? ({ "--focus-x": `${activePoint.x * 100}%`, "--focus-y": `${activePoint.y * 100}%` } as React.CSSProperties) : undefined;
  const pageHeroGeometry = frame?.id === "page-hero" && pageHeroPreview
    ? pageHeroFrameGeometry(pageHeroPreview, viewport)
    : undefined;
  const aspectRatio = pageHeroGeometry
    ? pageHeroGeometry.width / pageHeroGeometry.height
    : previewAspectRatio(frame?.id, viewport);
  const previewSizeStyle = {
    aspectRatio,
    width: pageHeroGeometry
      ? `min(100%, ${pageHeroGeometry.width}px, calc(var(--cms-preview-max, 22rem) * ${aspectRatio}))`
      : `${Math.min(320, Math.round(240 * aspectRatio))}px`,
  };
  const referenceViewport = pageHeroPreview ? pageHeroReferenceViewport(viewport) : undefined;
  const focalStyle = frame?.usesFocal
    ? ({ "--frame-position": focalObjectPosition(activePoint.x, activePoint.y) } as React.CSSProperties)
    : undefined;
  const displayUrl = previewSrc || previewUrl;
  const replaceLabel = value ? (
    <label className={styles.filePick}>
      {uploading ? "Загружаем…" : "Заменить фото"}
      <input
        aria-label={`${label}: файл`}
        type="file"
        accept={acceptAttribute(allowedMimeTypes)}
        disabled={uploading}
        onChange={(event) => {
          void onFile(event.target.files?.[0]);
          event.target.value = "";
        }}
      />
    </label>
  ) : null;
  const mediaActions = <div className={styles.mediaActions}>
    {replaceLabel}
    <MediaPicker disabled={uploading} excludeIds={assetId ? [assetId] : []} filterMimeTypes={[...allowedMimeTypes]} onSelect={chooseAsset} />
  </div>;
  return <fieldset
    className={styles.fields}
    data-cms-image-fields
    onDragOver={allowFileDrop ? acceptFileDrag : undefined}
    onDrop={allowFileDrop ? uploadDroppedFile : undefined}
  >
    <legend>{label}</legend>
    {displayUrl ? null : mediaActions}
    {uploadError ? <p role="alert">{uploadError}</p> : null}
    {displayUrl ? (
      <>
        {thumbs}
        <div className={styles.stage}>
          <div className={styles.previewColumn}>
            <div className={`${styles.previewFrame} ${frame ? frameStyles.host : ""}`}>
              <div
                ref={previewRef}
                className={`${styles.previewShot} ${frame ? frameStyles.shot : ""} ${previewSurface === "dark" ? styles.previewShotDark : ""}`}
                data-page-frame={frame?.id}
                data-page-hero-preview={pageHeroGeometry?.layout}
                data-preview-viewport={viewport}
                style={{ ...previewSizeStyle, ...(focusEnabled ? placementStyle : {}) }}
                aria-label="Предпросмотр фото и точки фокуса"
              >
                <img
                  ref={imageRef}
                  draggable={pageHeroGeometry ? false : undefined}
                  className={frame ? `${styles.preview} ${frameStyles.image}` : styles.preview}
                  style={focalStyle}
                  src={displayUrl}
                  alt={value?.alt || label}
                />
                {focusEnabled && value && (pageHeroGeometry ? (
                  <button
                    className={styles.imageDrag}
                    type="button"
                    aria-label={`Положение изображения (${viewport})`}
                    aria-describedby={dragInstructionsId}
                    onPointerDown={startImageDrag}
                    onPointerMove={moveImageDrag}
                    onPointerUp={endImageDrag}
                    onPointerCancel={endImageDrag}
                    onLostPointerCapture={endImageDrag}
                    onKeyDown={moveFocus}
                  />
                ) : (
                  <button className={styles.focusPoint} style={placementStyle} type="button" aria-label={`Точка фокуса (${viewport}): перетащите кружок; стрелки на клавиатуре`} onPointerDown={dragFocus} onPointerMove={moveDrag} onKeyDown={moveFocus} />
                ))}
              </div>
            </div>
          </div>
          {value ? (
            <div className={styles.controls}>
              {mediaActions}
              {replacementPending && manageReplacement ? <>
                <p className={styles.caption}>Новое фото появится на сайте после публикации.</p>
                <button type="button" className="ghost" disabled={uploading} onClick={() => void cancelReplacement()}>
                  Отменить замену
                </button>
              </> : null}
              {focusEnabled && (pageHeroGeometry
                ? <p className={styles.caption} id={dragInstructionsId}>Перетащите изображение или используйте стрелки на клавиатуре.</p>
                : <p className={styles.caption}>Перетащите кружок, чтобы сдвинуть кадр на карточке.</p>
              )}
              {focusEnabled ? <div className={styles.viewportControls} role="group" aria-label="Устройство для настройки кадра">
                {FOCAL_VIEWPORTS.map((mode) => <button key={mode} type="button" className={viewport === mode ? styles.viewportActive : styles.viewportButton} aria-label={mode === "desktop" ? "Desktop" : mode === "tablet" ? "Планшет" : "Мобильный"} aria-pressed={viewport === mode} onClick={() => setViewport(mode)}>
                  <ViewportIcon viewport={mode} />
                </button>)}
                {referenceViewport ? <span className={styles.viewportDimensions} aria-live="polite">{referenceViewport.width} × {referenceViewport.height} px</span> : null}
              </div> : null}
              <label>Подпись к фото<input value={value.alt} onChange={(event) => patch({ alt: event.target.value })} /></label>
              <button type="button" className="ghost" onClick={() => { onChange(undefined); setPreviewUrl(null); }}>Убрать фото</button>
            </div>
          ) : null}
        </div>
      </>
    ) : pageHeroPreview && value ? <button type="button" className="ghost" onClick={() => onChange(undefined)}>Убрать фото</button> : null}
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
            <MediaPicker
              compact
              excludeIds={slots.flatMap((slot) => slot ? [slot.assetId] : [])}
              onSelect={(asset) => onGalleryChange([...photos, emptyPlacement(asset.id)])}
            />
          </div>
        }
      />
    </div>
  );
}
