"use client";

import { useEffect, useState } from "react";

import { AdminClientError } from "@/admin/client/errors";
import { browserAdminClient } from "@/admin/client/localStore";
import type { MediaListItem } from "@/admin/domain/types";

import styles from "./MediaLibrary.module.css";

function readFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export function MediaLibrary() {
  const [items, setItems] = useState<MediaListItem[]>([]);
  const [message, setMessage] = useState("");

  async function reload() {
    setItems(await browserAdminClient().listAssets());
  }

  useEffect(() => {
    void reload();
  }, []);

  async function onUpload(file: File | undefined) {
    if (file == null) return;
    const dataUrl = await readFile(file);
    await browserAdminClient().createAsset({ name: file.name, mimeType: file.type, dataUrl });
    await reload();
  }

  async function onDelete(id: string) {
    setMessage("");
    try {
      await browserAdminClient().deleteAsset(id);
      await reload();
    } catch (error) {
      setMessage(error instanceof AdminClientError && error.code === "media_in_use" ? "Файл используется" : "error");
    }
  }

  return (
    <main className={styles.library}>
      <h1>Медиа</h1>
      <input aria-label="Загрузить файл" type="file" accept="image/*,application/pdf" onChange={(event) => void onUpload(event.target.files?.[0])} />
      {message ? <p>{message}</p> : null}
      <ul className={styles.grid}>
        {items.map((item) => (
          <li key={item.id} className={styles.card}>
            {item.mimeType.startsWith("image/") ? <img src={item.dataUrl} alt={item.name} /> : <p>{item.mimeType}</p>}
            <p>{item.name}</p>
            <p>{item.usedBy.length === 0 ? "Не используется" : item.usedBy.join(", ")}</p>
            <button type="button" disabled={item.usedBy.length > 0} onClick={() => void onDelete(item.id)}>
              Удалить
            </button>
          </li>
        ))}
      </ul>
    </main>
  );
}
