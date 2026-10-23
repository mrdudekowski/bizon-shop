"use client";

import { useState } from "react";
import type { DocumentLink } from "@/admin/domain/types";
import { browserAdminClient } from "@/admin/client/localStore";
import { MediaPicker } from "./MediaPicker";
import placementStyles from "./PlacementFields.module.css";
import styles from "./DocumentFields.module.css";
import { mediaMimeFromFile } from "./mediaMime";
import { uploadErrorText } from "./uploadError";

type Props = {
  value: DocumentLink[];
  onChange: (documents: DocumentLink[]) => void;
  label?: string;
};

function moveDocument(documents: DocumentLink[], index: number, delta: number): DocumentLink[] {
  const target = index + delta;
  if (target < 0 || target >= documents.length) return documents;
  const next = documents.slice();
  const [item] = next.splice(index, 1);
  next.splice(target, 0, item);
  return next;
}

export function DocumentFields({ value, onChange, label = "Документы" }: Props) {
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);

  async function upload(file?: File) {
    if (!file) return;
    setError("");
    setUploading(true);
    try {
      const asset = await browserAdminClient().createAsset({
        name: file.name,
        mimeType: mediaMimeFromFile(file),
        body: file,
      });
      onChange([...value, { assetId: asset.id, title: file.name }]);
    } catch (cause) {
      setError(uploadErrorText(cause));
    } finally {
      setUploading(false);
    }
  }

  return (
    <section>
      <h2>{label}</h2>
      {value.map((document, index) => (
        <div key={`${document.assetId}-${index}`} className={styles.row}>
          <label>
            Название документа
            <input
              value={document.title}
              onChange={(event) => {
                const documents = value.slice();
                documents[index] = { ...document, title: event.target.value };
                onChange(documents);
              }}
            />
          </label>
          <button type="button" onClick={() => onChange(value.filter((_, itemIndex) => itemIndex !== index))}>Убрать документ</button>
          <button type="button" disabled={index === 0} onClick={() => onChange(moveDocument(value, index, -1))}>Выше</button>
          <button type="button" disabled={index === value.length - 1} onClick={() => onChange(moveDocument(value, index, 1))}>Ниже</button>
        </div>
      ))}
      <div className={styles.actions}>
        <label className={placementStyles.filePick}>
          {uploading ? "Загружаем PDF…" : "Загрузить PDF"}
          <input
            aria-label="Загрузить PDF"
            type="file"
            accept=".pdf,application/pdf"
            disabled={uploading}
            onChange={(event) => {
              void upload(event.target.files?.[0]);
              event.target.value = "";
            }}
          />
        </label>
        <MediaPicker
          buttonLabel="Выбрать PDF из галереи"
          pickerTitle="Выбрать PDF-документ"
          itemLabel="документ"
          emptyMessage="Неиспользуемых PDF нет. Можно показать используемые или загрузить новый файл."
          filterMimeTypes={["application/pdf"]}
          excludeIds={value.map((document) => document.assetId)}
          disabled={uploading}
          onSelect={(asset) => onChange([...value, { assetId: asset.id, title: asset.name }])}
        />
      </div>
      {error ? <p role="alert">{error}</p> : null}
    </section>
  );
}
