"use client";

import { useRef, useState } from "react";

import { browserAdminClient } from "@/admin/client/localStore";
import type { PublicationDraftRef } from "@/admin/domain/types";
import styles from "./publications.module.css";

type DraftAction = "publish" | "restore";

function draftKey(draft: PublicationDraftRef): string {
  return `${draft.entityType}:${draft.entityId}`;
}

const ENTITY_LABEL: Record<PublicationDraftRef["entityType"], string> = {
  "tire-direction": "Направление шин",
  "tire-model": "Модель шины",
  "wheel-type": "Тип дисков",
  "wheel-model": "Модель дисков",
  "shop-category": "Категория Bizon Shop",
  "shop-product": "Товар Bizon Shop",
  page: "Страница сайта",
  material: "Материал",
};

function actionError(error: unknown, action: DraftAction): string {
  const code = error != null && typeof error === "object" && "code" in error ? String(error.code) : "";
  if (code === "conflict") return "Состав черновиков изменился. Обновите список и повторите действие.";
  if (code === "publish_blocked") return action === "publish"
    ? "Операция отменена: проверьте обязательные поля и возможность публикации выбранных карточек."
    : "Не удалось восстановить предыдущие версии выбранных карточек.";
  return action === "publish" ? "Не удалось опубликовать черновики." : "Не удалось отменить черновики.";
}

export function SavedDraftList({ drafts, onUpdated }: { drafts: PublicationDraftRef[]; onUpdated: (message: string) => void }) {
  const [selected, setSelected] = useState<string[]>([]);
  const [action, setAction] = useState<DraftAction | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const dialogRef = useRef<HTMLDialogElement>(null);
  const selectedDrafts = drafts.filter((draft) => selected.includes(draftKey(draft)));

  function openAction(next: DraftAction, targets: PublicationDraftRef[]) {
    setSelected(targets.map(draftKey));
    setAction(next);
    dialogRef.current?.showModal();
  }

  async function confirmAction() {
    if (!action || selectedDrafts.length === 0) return;
    setBusy(true);
    setMessage("");
    try {
      if (action === "publish") await browserAdminClient().publishSavedDrafts(selectedDrafts);
      else await browserAdminClient().restoreSavedDrafts(selectedDrafts);
      const count = selectedDrafts.length;
      const result = action === "publish"
        ? `Опубликовано черновиков: ${count}. Статус обновления сайта отображается в уведомлении CMS.`
        : `Восстановлены предыдущие версии: ${count}. Новые неопубликованные карточки удалены.`;
      setSelected([]);
      setAction(null);
      setMessage(result);
      onUpdated(result);
    } catch (error) {
      setMessage(actionError(error, action));
    } finally {
      setBusy(false);
      dialogRef.current?.close();
    }
  }

  const allSelected = drafts.length > 0 && drafts.every((draft) => selected.includes(draftKey(draft)));

  return (
    <div>
      {message ? <p className={styles.status} role="status">{message}</p> : null}
      <div className={styles.draftToolbar}>
        <label className={styles.selectAll}>
          <input
            type="checkbox"
            checked={allSelected}
            onChange={(event) => setSelected(event.target.checked ? drafts.map(draftKey) : [])}
          />
          Выбрать все черновики
        </label>
        {selectedDrafts.length > 0 ? (
          <div className={styles.rowActions}>
            <button type="button" onClick={() => openAction("publish", selectedDrafts)}>Опубликовать выбранные ({selectedDrafts.length})</button>
            <button type="button" onClick={() => openAction("restore", selectedDrafts)}>Восстановить предыдущие версии ({selectedDrafts.length})</button>
          </div>
        ) : null}
      </div>
      <ul className={styles.list}>
        {drafts.map((draft) => {
          const key = draftKey(draft);
          return (
            <li key={key} className={styles.row}>
              <div className={styles.rowHead}>
                <label className={styles.draftSelect}>
                  <input
                    type="checkbox"
                    checked={selected.includes(key)}
                    onChange={(event) => setSelected((current) => event.target.checked
                      ? [...new Set([...current, key])]
                      : current.filter((item) => item !== key))}
                    aria-label={`Выбрать черновик: ${draft.title}`}
                  />
                </label>
                <div className={styles.rowBody}>
                  <strong>{draft.title}</strong>
                  <span className={styles.rowMeta}>
                    {ENTITY_LABEL[draft.entityType]} · {draft.hasPublishedVersion ? "предыдущая версия опубликована" : "новая карточка"}
                  </span>
                </div>
                <span className={`${styles.chip} ${styles.chipPending}`}>Черновик</span>
                <div className={styles.rowActions}>
                  <button type="button" onClick={() => openAction("publish", [draft])}>Опубликовать</button>
                  <button type="button" onClick={() => openAction("restore", [draft])}>Отменить черновик</button>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
      <dialog ref={dialogRef} className={styles.dialog} onClose={() => { if (!busy) setAction(null); }}>
        <div className={styles.dialogBody}>
          <h2>{action === "publish" ? "Опубликовать выбранные черновики?" : "Восстановить предыдущие версии?"}</h2>
          <p>
            {action === "publish"
              ? `На сайт будут опубликованы ${selectedDrafts.length} выбранных ${selectedDrafts.length === 1 ? "черновик" : "черновика"}. Действие применяется ко всему выбору.`
              : `Черновые изменения ${selectedDrafts.length} выбранных карточек будут отменены. Новые карточки без опубликованной версии будут удалены.`}
          </p>
          <ul className={styles.fields}>
            {selectedDrafts.map((draft) => <li key={draftKey(draft)}>{draft.title}</li>)}
          </ul>
          <div className={styles.dialogActions}>
            <button type="button" className="ghost" disabled={busy} onClick={() => dialogRef.current?.close()}>Назад</button>
            <button type="button" className={action === "restore" ? styles.danger : "primary"} disabled={busy || selectedDrafts.length === 0} onClick={() => void confirmAction()}>
              {busy ? "Выполняем…" : action === "publish" ? "Опубликовать" : "Восстановить"}
            </button>
          </div>
        </div>
      </dialog>
    </div>
  );
}
