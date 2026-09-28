"use client";
import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type DragEvent as ReactDragEvent,
  type PointerEvent as ReactPointerEvent,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
} from "react";
import type { ImagePlacement, MediaListItem } from "@/admin/domain/types";
import { resolveMediaPreviewUrl } from "@/admin/domain/catalogPreviewUrl";
import { AdminClientError } from "@/admin/client/errors";
import { browserAdminClient } from "@/admin/client/localStore";
import { reorderGallery, swapWithCover } from "@/admin/media/placementGallery";
import styles from "./PlacementFields.module.css";

function emptyPlacement(assetId: string): ImagePlacement {
  return { assetId, alt: "", focalX: 0.5, focalY: 0.5, crop: { x: 0, y: 0, width: 1, height: 1 } };
}
function clamp(value: number) {
  return Math.min(1, Math.max(0, value));
}
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
  const fields = first.closest("[data-cms-image-fields]");
  const room = Math.floor(footer.getBoundingClientRect().top - first.getBoundingClientRect().top - 8);
  const widthCap = Math.floor(fields?.getBoundingClientRect().width ?? window.innerWidth);
  document.documentElement.style.setProperty(
    "--cms-preview-max",
    `${Math.max(72, Math.min(room, widthCap, Math.round(window.innerHeight - 220)))}px`,
  );
}

function FileUploadButton({
  label,
  ariaLabel,
  accept = "image/*",
  multiple,
  disabled,
  onFiles,
}: {
  label: string;
  ariaLabel: string;
  accept?: string;
  multiple?: boolean;
  disabled?: boolean;
  onFiles: (files: FileList | null) => void;
}) {
  return (
    <label className={`${styles.fileButton} ${disabled ? styles.fileButtonDisabled : ""}`}>
      {label}
      <input
        aria-label={ariaLabel}
        type="file"
        accept={accept}
        multiple={multiple}
        disabled={disabled}
        onChange={(event) => {
          onFiles(event.target.files);
          event.target.value = "";
        }}
      />
    </label>
  );
}

type Props = {
  value: ImagePlacement | undefined;
  onChange: (value: ImagePlacement | undefined) => void;
  label?: string;
  thumbs?: ReactNode;
  previewSrc?: string | null;
  showFocus?: boolean;
  catalogPreviewSrc?: string | null;
  catalogPlacementStyle?: React.CSSProperties;
  extraControls?: ReactNode;
  fileUploading?: boolean;
};

export function PlacementFields({
  value,
  onChange,
  label = "Фото",
  thumbs,
  previewSrc,
  showFocus = true,
  catalogPreviewSrc,
  catalogPlacementStyle,
  extraControls,
  fileUploading = false,
}: Props) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState("");
  const [dragging, setDragging] = useState(false);
  const frame = useRef<HTMLDivElement>(null);
  const assetId = value?.assetId;
  useEffect(() => {
    return () => {
      if (previewUrl?.startsWith("blob:")) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);
  useEffect(() => {
    if (!assetId) {
      setPreviewUrl(null);
      return;
    }
    let cancelled = false;
    void browserAdminClient()
      .listAssets()
      .then((assets: MediaListItem[]) => {
        if (!cancelled) setPreviewUrl(resolveMediaPreviewUrl(assets.find((asset) => asset.id === assetId)?.dataUrl));
      });
    return () => {
      cancelled = true;
    };
  }, [assetId]);
  useLayoutEffect(() => {
    if (!previewUrl && !previewSrc) return;
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
  }, [previewUrl, previewSrc]);
  async function onFile(file?: File) {
    if (!file || fileUploading) return;
    setUploadError("");
    try {
      const placement = await uploadImageFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      onChange(placement);
    } catch (error) {
      setUploadError(uploadErrorText(error));
    }
  }
  function onDrop(event: ReactDragEvent<HTMLLabelElement>) {
    event.preventDefault();
    setDragging(false);
    void onFile(event.dataTransfer.files?.[0]);
  }
  function patch(next: Partial<ImagePlacement>) {
    if (value) onChange({ ...value, ...next });
  }
  function pointAt(event: ReactPointerEvent) {
    if (!showFocus || !value || !frame.current) return;
    const bounds = frame.current.getBoundingClientRect();
    patch({
      focalX: clamp((event.clientX - bounds.left) / bounds.width),
      focalY: clamp((event.clientY - bounds.top) / bounds.height),
    });
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
    const step = event.shiftKey ? 0.05 : 0.01;
    const delta = ({ ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] } as const)[
      event.key as "ArrowLeft" | "ArrowRight" | "ArrowUp" | "ArrowDown"
    ];
    if (delta) {
      event.preventDefault();
      patch({ focalX: clamp(value.focalX + delta[0]), focalY: clamp(value.focalY + delta[1]) });
    }
  }
  const placementStyle = value
    ? ({ "--focus-x": `${value.focalX * 100}%`, "--focus-y": `${value.focalY * 100}%` } as React.CSSProperties)
    : undefined;
  const displayUrl = previewSrc || previewUrl;
  const catalogUrl = catalogPreviewSrc ?? (showFocus ? displayUrl : null);
  const catalogStyle = catalogPlacementStyle ?? placementStyle;
  const dropzone = (
    <label
      className={`${styles.dropzone} ${dragging ? styles.dropzoneActive : ""}`}
      data-cms-photo-anchor="main"
      onDragOver={(event) => {
        event.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
    >
      <strong>Загрузить фото</strong>
      Перетащите файл сюда или нажмите, чтобы выбрать
      <input
        aria-label={`${label}: файл`}
        type="file"
        accept="image/*"
        disabled={fileUploading}
        onChange={(event) => void onFile(event.target.files?.[0])}
      />
    </label>
  );
  return (
    <fieldset className={styles.fields} data-cms-image-fields>
      <legend>{label}</legend>
      {displayUrl ? null : dropzone}
      {uploadError ? <p role="alert">{uploadError}</p> : null}
      {displayUrl ? (
        <>
          {thumbs}
          <div className={styles.stage}>
            <div className={styles.previewColumn}>
              <div className={styles.previewFrame}>
                <div
                  ref={frame}
                  className={styles.previewShot}
                  style={showFocus ? placementStyle : undefined}
                  aria-label="Предпросмотр фото и точки фокуса"
                >
                  <img className={styles.preview} src={displayUrl} alt={value?.alt || label} />
                  {showFocus && value ? (
                    <button
                      className={styles.focusPoint}
                      style={placementStyle}
                      type="button"
                      aria-label="Точка фокуса: перетащите кружок; стрелки на клавиатуре"
                      onPointerDown={dragFocus}
                      onPointerMove={moveDrag}
                      onKeyDown={moveFocus}
                    />
                  ) : null}
                </div>
              </div>
              {showFocus && catalogUrl ? (
                <div className={styles.catalogBlock}>
                  <p className={styles.caption}>На сайте</p>
                  <div className={styles.catalogPreview} style={catalogStyle}>
                    <img className={styles.preview} src={catalogUrl} alt="" />
                  </div>
                </div>
              ) : null}
            </div>
            {value ? (
              <div className={styles.controls}>
                <div className={styles.controlGroup}>
                  <h3 className={styles.controlHeading}>Файл</h3>
                  <FileUploadButton
                    label={fileUploading ? "Загружаем…" : value ? "Заменить фото" : "Загрузить фото"}
                    ariaLabel={`${label}: файл`}
                    disabled={fileUploading}
                    onFiles={(files) => void onFile(files?.[0])}
                  />
                </div>
                {showFocus ? (
                  <div className={styles.controlGroup}>
                    <p className={styles.caption}>Точка фокуса — центр кадра на карточке каталога.</p>
                    <button type="button" className="ghost" onClick={() => patch({ focalX: 0.5, focalY: 0.5 })}>
                      По центру
                    </button>
                  </div>
                ) : null}
                {extraControls}
                <div className={styles.controlGroup}>
                  <h3 className={styles.controlHeading}>Подпись</h3>
                  <p className={styles.caption}>Для поиска и доступности.</p>
                  <label>
                    Подпись к фото
                    <input value={value.alt} onChange={(event) => patch({ alt: event.target.value })} />
                  </label>
                </div>
                <button
                  type="button"
                  className={styles.dangerOutline}
                  onClick={() => {
                    onChange(undefined);
                    setPreviewUrl(null);
                  }}
                >
                  Убрать фото
                </button>
              </div>
            ) : null}
          </div>
        </>
      ) : null}
    </fieldset>
  );
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
  const [dragGalleryIndex, setDragGalleryIndex] = useState<number | null>(null);
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
    return () => {
      cancelled = true;
    };
  }, [assetKey]);
  useEffect(() => {
    setPinned((current) => Math.min(current, Math.max(0, slots.length - 1)));
    setHovered(null);
  }, [slots.length]);
  const shown = hovered ?? pinned;
  const pinnedPlacement = slots[pinned];
  const shownPlacement = slots[shown];
  const shownUrl = shownPlacement ? urls[shownPlacement.assetId] : null;
  const coverStyle = cover
    ? ({ "--focus-x": `${cover.focalX * 100}%`, "--focus-y": `${cover.focalY * 100}%` } as React.CSSProperties)
    : undefined;
  const coverUrl = cover ? urls[cover.assetId] : null;
  function pin(index: number) {
    setPinned(index);
    setHovered(null);
  }
  function onPinnedChange(next: ImagePlacement | undefined) {
    if (pinned === 0) onCoverChange(next);
    else if (!next) {
      onGalleryChange(photos.filter((_, index) => index !== pinned - 1));
      setPinned((current) => (current === pinned ? Math.max(0, pinned - 1) : current > pinned ? current - 1 : current));
    } else {
      onGalleryChange(photos.map((photo, index) => (index === pinned - 1 ? next : photo)));
    }
  }
  function makeMain() {
    if (pinned <= 0) return;
    const next = swapWithCover(cover, photos, pinned - 1);
    onCoverChange(next.cover);
    onGalleryChange(next.gallery);
    setPinned(0);
    setHovered(null);
  }
  async function onFiles(files: FileList | null) {
    if (!files?.length || uploading) return;
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
  function onGalleryDrop(targetGalleryIndex: number) {
    if (dragGalleryIndex == null || dragGalleryIndex === targetGalleryIndex) return;
    onGalleryChange(reorderGallery(photos, dragGalleryIndex, targetGalleryIndex));
    setDragGalleryIndex(null);
  }
  const addPhoto = (
    <label className={`${styles.thumbAdd} ${uploading ? styles.thumbAddDisabled : ""}`} data-cms-photo-anchor="main">
      {uploading ? "Загружаем…" : "Добавить фото"}
      <input
        aria-label="Добавить фото"
        type="file"
        accept="image/*"
        multiple
        disabled={uploading}
        onChange={(event) => {
          void onFiles(event.target.files);
        }}
      />
    </label>
  );
  return (
    <div className={styles.productPhotos} data-cms-photo-anchor={cover ? undefined : "main"}>
      <PlacementFields
        label={pinned === 0 ? "Главное фото" : `Фото ${pinned}`}
        value={pinnedPlacement}
        onChange={onPinnedChange}
        previewSrc={shown === pinned ? undefined : shownUrl}
        showFocus={pinned === 0 && shown === pinned && Boolean(pinnedPlacement)}
        catalogPreviewSrc={coverUrl}
        catalogPlacementStyle={coverStyle}
        fileUploading={uploading}
        extraControls={
          pinned > 0 && pinnedPlacement ? (
            <div className={styles.controlGroup}>
              <button type="button" onClick={makeMain}>
                Сделать главным
              </button>
            </div>
          ) : null
        }
        thumbs={
          <div className={styles.thumbs} aria-label="Фотографии товара" onMouseLeave={() => setHovered(null)}>
            {slots.map((slot, index) => (
              <button
                key={slot?.assetId ?? `empty-${index}`}
                type="button"
                className={index === pinned ? `${styles.thumbActive} ${styles.thumbSelected}` : undefined}
                aria-pressed={index === pinned}
                aria-label={index === 0 ? "Главное фото" : `Фото ${index}`}
                draggable={index > 0 && Boolean(slot)}
                onDragStart={() => {
                  if (index > 0) setDragGalleryIndex(index - 1);
                }}
                onDragEnd={() => setDragGalleryIndex(null)}
                onDragOver={(event) => {
                  if (index > 0) event.preventDefault();
                }}
                onDrop={(event) => {
                  event.preventDefault();
                  if (index > 0) onGalleryDrop(index - 1);
                }}
                onMouseEnter={() => setHovered(index)}
                onClick={() => pin(index)}
              >
                {index === 0 && slot ? <span className={styles.thumbBadge}>Главное</span> : null}
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
