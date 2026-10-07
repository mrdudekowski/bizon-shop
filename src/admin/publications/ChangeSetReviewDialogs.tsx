"use client";

import { useRef, useState } from "react";

import { AdminClientError } from "@/admin/client/errors";
import { ERROR_TEXT } from "@/admin/client/errorText";
import { browserAdminClient } from "@/admin/client/localStore";
import type { ChangeSet } from "@/admin/domain/types";

import { changeCount, documentTitles, pluralChanges } from "./changeSetView";
import styles from "./publications.module.css";

export function ChangeSetReviewDialogs({
  pack,
  onUpdated,
}: {
  pack: ChangeSet;
  onUpdated: (next: ChangeSet, message: string) => void;
}) {
  const publishRef = useRef<HTMLDialogElement>(null);
  const returnRef = useRef<HTMLDialogElement>(null);
  const cancelRef = useRef<HTMLDialogElement>(null);
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const titles = documentTitles(pack);
  const count = changeCount(pack);

  function closeAll() {
    publishRef.current?.close();
    returnRef.current?.close();
    cancelRef.current?.close();
    setError("");
    setBusy(false);
  }

  async function publish() {
    setBusy(true);
    setError("");
    try {
      const next = await browserAdminClient().publishChangeSet(pack.id);
      closeAll();
      onUpdated(next, "Пакет опубликован. На сайте новая версия документов.");
    } catch (reason) {
      setError(reason instanceof AdminClientError ? ERROR_TEXT[reason.code] : "Не удалось опубликовать пакет");
      setBusy(false);
    }
  }

  async function returnPack() {
    if (!comment.trim()) return;
    setBusy(true);
    setError("");
    try {
      const next = await browserAdminClient().returnChangeSet(pack.id, comment.trim());
      closeAll();
      setComment("");
      onUpdated(next, "Пакет вернули на доработку.");
    } catch (reason) {
      setError(reason instanceof AdminClientError ? ERROR_TEXT[reason.code] : "Не удалось вернуть пакет");
      setBusy(false);
    }
  }

  async function cancel() {
    setBusy(true);
    setError("");
    try {
      const next = await browserAdminClient().cancelChangeSet(pack.id);
      closeAll();
      onUpdated(next, "Пакет отменён. Правки сброшены.");
    } catch (reason) {
      setError(reason instanceof AdminClientError ? ERROR_TEXT[reason.code] : "Не удалось отменить пакет");
      setBusy(false);
    }
  }

  if (pack.status !== "pending_review") return null;

  return (
    <>
      <button type="button" className="primary" onClick={() => { setError(""); publishRef.current?.showModal(); }}>
        Опубликовать
      </button>
      <button type="button" onClick={() => { setError(""); setComment(""); returnRef.current?.showModal(); }}>
        Вернуть
      </button>
      <button type="button" onClick={() => { setError(""); cancelRef.current?.showModal(); }}>
        Отменить
      </button>

      <dialog ref={publishRef} className={styles.dialog}>
        <form className={styles.dialogBody} onSubmit={(event) => { event.preventDefault(); void publish(); }}>
          <h2>Опубликовать пакет?</h2>
          <p>
            На сайт уйдут {count} {pluralChanges(count)} в документах: {titles || "без названия"}. Посетители увидят новую версию.
          </p>
          {error ? <p role="alert">{error}</p> : null}
          <div className={styles.dialogActions}>
            <button type="button" className="ghost" onClick={() => publishRef.current?.close()}>Отмена</button>
            <button type="submit" className="primary" disabled={busy}>{busy ? "Публикуем…" : "Опубликовать"}</button>
          </div>
        </form>
      </dialog>

      <dialog ref={returnRef} className={styles.dialog}>
        <form className={styles.dialogBody} onSubmit={(event) => { event.preventDefault(); void returnPack(); }}>
          <h2>Вернуть на доработку</h2>
          <p>Редактор {pack.authorLogin} получит комментарий и сможет поправить этот пакет.</p>
          <label>
            Комментарий
            <textarea required value={comment} onChange={(event) => setComment(event.target.value)} rows={4} />
          </label>
          {error ? <p role="alert">{error}</p> : null}
          <div className={styles.dialogActions}>
            <button type="button" className="ghost" onClick={() => returnRef.current?.close()}>Отмена</button>
            <button type="submit" className="primary" disabled={busy || !comment.trim()}>{busy ? "Возвращаем…" : "Вернуть"}</button>
          </div>
        </form>
      </dialog>

      <dialog ref={cancelRef} className={styles.dialog}>
        <form className={styles.dialogBody} onSubmit={(event) => { event.preventDefault(); void cancel(); }}>
          <h2>Отменить пакет?</h2>
          <p>
            Правки пакета будут сброшены. Опубликованная версия на сайте не изменится. Неотправленные поля в этих карточках вернутся к состоянию до этого пакета. Это нельзя отменить из интерфейса.
          </p>
          {error ? <p role="alert">{error}</p> : null}
          <div className={styles.dialogActions}>
            <button type="button" className="ghost" onClick={() => cancelRef.current?.close()}>Назад</button>
            <button type="submit" className={styles.danger} disabled={busy}>{busy ? "Отменяем…" : "Отменить изменения"}</button>
          </div>
        </form>
      </dialog>
    </>
  );
}
