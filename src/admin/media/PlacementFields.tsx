"use client";

import { useEffect, useState } from "react";

import { browserAdminClient } from "@/admin/client/localStore";
import type { ImagePlacement } from "@/admin/domain/types";

import styles from "./PlacementFields.module.css";

function readFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function emptyPlacement(assetId: string): ImagePlacement {
  return {
    assetId,
    alt: "",
    focalX: 0.5,
    focalY: 0.5,
    crop: { x: 0, y: 0, width: 1, height: 1 },
  };
}

function readNumber(raw: string, fallback: number): number {
  if (raw === "") return fallback;
  const next = Number(raw);
  return Number.isFinite(next) ? next : fallback;
}

type PlacementFieldsProps = {
  value: ImagePlacement | undefined;
  onChange: (value: ImagePlacement | undefined) => void;
  label?: string;
};

export function PlacementFields({ value, onChange, label = "Изображение" }: PlacementFieldsProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (value == null) {
      setPreviewUrl(null);
      return;
    }
    let cancelled = false;
    void browserAdminClient()
      .listAssets()
      .then((assets) => {
        if (cancelled) return;
        setPreviewUrl(assets.find((asset) => asset.id === value.assetId)?.dataUrl ?? null);
      });
    return () => {
      cancelled = true;
    };
  }, [value?.assetId]);

  async function onFile(file: File | undefined) {
    if (file == null) return;
    const dataUrl = await readFile(file);
    const asset = await browserAdminClient().createAsset({
      name: file.name,
      mimeType: file.type,
      dataUrl,
    });
    onChange(emptyPlacement(asset.id));
  }

  function patch(next: Partial<ImagePlacement>) {
    if (value == null) return;
    onChange({ ...value, ...next });
  }

  function patchCrop(next: Partial<ImagePlacement["crop"]>) {
    if (value == null) return;
    onChange({ ...value, crop: { ...value.crop, ...next } });
  }

  return (
    <fieldset className={styles.fields}>
      <legend>{label}</legend>
      <input
        aria-label={`${label}: файл`}
        type="file"
        accept="image/*"
        onChange={(event) => void onFile(event.target.files?.[0])}
      />
      {value ? (
        <>
          {previewUrl ? (
            <img
              className={styles.preview}
              src={previewUrl}
              alt={value.alt || label}
              style={{ objectPosition: `${value.focalX * 100}% ${value.focalY * 100}%` }}
            />
          ) : null}
          <label>
            Подпись
            <input
              value={value.alt}
              onChange={(event) => patch({ alt: event.target.value })}
            />
          </label>
          <div className={styles.numbers}>
            <label>
              Фокус X
              <input
                type="number"
                step="any"
                value={value.focalX}
                onChange={(event) => patch({ focalX: readNumber(event.target.value, value.focalX) })}
              />
            </label>
            <label>
              Фокус Y
              <input
                type="number"
                step="any"
                value={value.focalY}
                onChange={(event) => patch({ focalY: readNumber(event.target.value, value.focalY) })}
              />
            </label>
            <label>
              Кадр X
              <input
                type="number"
                step="any"
                value={value.crop.x}
                onChange={(event) => patchCrop({ x: readNumber(event.target.value, value.crop.x) })}
              />
            </label>
            <label>
              Кадр Y
              <input
                type="number"
                step="any"
                value={value.crop.y}
                onChange={(event) => patchCrop({ y: readNumber(event.target.value, value.crop.y) })}
              />
            </label>
            <label>
              Кадр ширина
              <input
                type="number"
                step="any"
                value={value.crop.width}
                onChange={(event) => patchCrop({ width: readNumber(event.target.value, value.crop.width) })}
              />
            </label>
            <label>
              Кадр высота
              <input
                type="number"
                step="any"
                value={value.crop.height}
                onChange={(event) => patchCrop({ height: readNumber(event.target.value, value.crop.height) })}
              />
            </label>
          </div>
          <button type="button" onClick={() => onChange(undefined)}>
            Убрать
          </button>
        </>
      ) : null}
    </fieldset>
  );
}
