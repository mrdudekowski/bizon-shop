"use client";

import { useState } from "react";

import { AdminClientError } from "@/admin/client/errors";
import type { DocumentStatus } from "@/admin/domain/types";
import styles from "./catalog.module.css";

const STATUS_LABEL: Record<DocumentStatus, string> = {
  draft: "черновик",
  on_site: "на сайте",
  hidden: "скрыто",
};

function errorMessage(error: unknown): string {
  if (error instanceof AdminClientError) {
    if (error.code === "publish_blocked") return "Публикация пока недоступна: проверьте обязательные поля карточки.";
    if (error.code === "unsaved") return "Сначала сохраните изменения в карточке.";
  }
  return "Не удалось изменить статус. Попробуйте ещё раз.";
}

export function StatusControl({
  status,
  title,
  onChange,
}: {
  status: DocumentStatus;
  title: string;
  onChange: (status: DocumentStatus) => Promise<void>;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function change(nextStatus: DocumentStatus) {
    if (busy || nextStatus === status) return;
    setBusy(true);
    setError("");
    try {
      await onChange(nextStatus);
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setBusy(false);
    }
  }

  return (
    <span className={styles.statusControlWrap}>
      <span className={`${styles.statusControl} ${status === "on_site" ? styles.statusOnSite : ""} ${busy ? styles.statusBusy : ""}`}>
        <span>{busy ? "сохраняем…" : STATUS_LABEL[status]}</span>
        <select
          aria-label={`Изменить статус «${title}»`}
          title="Изменить статус"
          value={status}
          disabled={busy}
          onChange={(event) => void change(event.target.value as DocumentStatus)}
        >
          {(Object.keys(STATUS_LABEL) as DocumentStatus[]).map((option) => (
            <option key={option} value={option} disabled={status === "draft" && option === "hidden"}>
              {STATUS_LABEL[option]}
            </option>
          ))}
        </select>
        <span className={styles.statusChevron} aria-hidden="true">⌄</span>
      </span>
      {error ? <span className={styles.statusError} role="alert">{error}</span> : null}
    </span>
  );
}
