"use client";

import { useCallback, useEffect, useState } from "react";
import { browserAdminClient } from "@/admin/client/localStore";
import { AdminClientError } from "@/admin/client/errors";
import type { MediaDeletionHistoryItem, MediaListItem } from "@/admin/domain/types";
import { useAdminSession } from "@/admin/ui/DocumentUI";
import { AdminLoading } from "@/admin/ui/AdminLoading";
import { SectionAccessNotice } from "@/admin/ui/SectionAccessNotice";
import styles from "./MediaLibrary.module.css";

function mediaActionError(error: unknown): string {
  if (error instanceof AdminClientError && error.code === "storage_unavailable") return "Хранилище файлов недоступно. Попробуйте позже.";
  if (error instanceof AdminClientError && error.code === "media_storage_key_missing") return "Для этого старого файла пока нельзя выполнить безопасное удаление.";
  return "Не удалось выполнить действие. Обновите страницу и попробуйте ещё раз.";
}

export function MediaLibrary() {
  const session = useAdminSession();
  const [assets, setAssets] = useState<MediaListItem[]>([]);
  const [history, setHistory] = useState<MediaDeletionHistoryItem[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const reload = useCallback(async () => {
    const client = browserAdminClient();
    const [nextAssets, nextHistory] = await Promise.all([client.listAssets(), client.listMediaDeletionHistory()]);
    setAssets(nextAssets);
    setHistory(nextHistory);
  }, []);

  useEffect(() => {
    void reload().catch((cause) => setError(mediaActionError(cause))).finally(() => setLoading(false));
  }, [reload]);

  if (!session) return <main><AdminLoading label="Проверяем доступ…" /></main>;
  if (session.role !== "admin") return <SectionAccessNotice title="Файлы" icon="image" />;

  async function remove(asset: MediaListItem) {
    if (asset.usedBy.length > 0) return;
    if (!window.confirm(`Удалить файл «${asset.name}» из хранилища? Это действие нельзя отменить.`)) return;
    setError("");
    setBusyId(asset.id);
    try {
      await browserAdminClient().deleteAsset(asset.id);
      await reload();
    } catch (cause) {
      setError(mediaActionError(cause));
      if (cause instanceof AdminClientError && cause.code === "media_in_use") await reload();
    } finally {
      setBusyId(null);
    }
  }

  return <main className={styles.page}>
    <header className={styles.header}><div><h1>Файлы</h1><p>Загруженные изображения и места, где они используются.</p></div><span>{assets.length} файлов</span></header>
    {error ? <p className={styles.error} role="alert">{error}</p> : null}
    {loading ? <AdminLoading label="Загружаем файлы…" /> : assets.length === 0 ? <p className={styles.empty}>Загруженных файлов пока нет.</p> : <ul className={styles.list}>
      {assets.map((asset) => <li className={styles.asset} key={asset.id}>
        <img className={styles.preview} src={asset.dataUrl} alt="" />
        <div className={styles.details}><strong>{asset.name}</strong><span>{asset.mimeType || "Тип не указан"}</span>
          {asset.replacementPending ? <span className={styles.unused}>Новая версия покажется на сайте после публикации.</span> : null}
          {asset.usedBy.length > 0 ? <div className={styles.usage}><b>Используется:</b><ul>{asset.usedBy.map((place, index) => <li key={`${place}-${index}`}>{place}</li>)}</ul></div> : <span className={styles.unused}>Нигде не используется</span>}
        </div>
        <button className="ghost" type="button" disabled={asset.usedBy.length > 0 || busyId === asset.id} onClick={() => void remove(asset)}>
          {busyId === asset.id ? "Удаляем…" : "Удалить"}
        </button>
      </li>)}
    </ul>}
    <section className={styles.history} aria-labelledby="media-history-title">
      <div><h2 id="media-history-title">История удалений</h2><p>Видна только администраторам. Хранятся последние 200 записей.</p></div>
      {history.length === 0 ? <p>Записей пока нет.</p> : <ul>{history.map((item) => <li key={item.id}><strong>{item.filename} · ID файла {item.mediaId}</strong><span>{item.deletedBy}</span><time dateTime={item.deletedAt}>{new Date(item.deletedAt).toLocaleString("ru-RU")}</time></li>)}</ul>}
    </section>
  </main>;
}
