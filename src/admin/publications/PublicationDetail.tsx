"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { browserAdminClient } from "@/admin/client/localStore";
import type { ChangeSet, FieldValue } from "@/admin/domain/types";
import { AdminLoading } from "@/admin/ui/AdminLoading";
import { useAdminSession } from "@/admin/ui/DocumentUI";
import { SectionAccessNotice } from "@/admin/ui/SectionAccessNotice";

import { ChangeSetReviewDialogs } from "./ChangeSetReviewDialogs";
import {
  CHANGESET_STATUS_LABEL,
  editorHref,
  formatExactWhen,
  formatFieldValue,
  packTitle,
} from "./changeSetView";
import styles from "./publications.module.css";

function ImageSlot({ value, label }: { value: FieldValue; label: string }) {
  const url = value.kind === "image" ? value.previewUrl : null;
  return (
    <div>
      <span className={styles.valueLabel}>{label}</span>
      <span className={styles.preview}>
        {url ? <img src={url} alt={value.kind === "image" ? value.alt ?? "" : ""} /> : "Нет фото"}
      </span>
    </div>
  );
}

export function PublicationDetail({ id }: { id: string }) {
  const session = useAdminSession();
  const [pack, setPack] = useState<ChangeSet | null>(null);
  const [missing, setMissing] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (session?.role !== "admin") return;
    void browserAdminClient()
      .getChangeSet(id)
      .then(setPack)
      .catch(() => setMissing(true));
  }, [id, session?.role]);

  if (session == null) return <main className={styles.screen}><AdminLoading label="Проверяем доступ…" /></main>;
  if (session.role !== "admin") return <SectionAccessNotice title="Публикации" icon="publications" />;
  if (missing) {
    return (
      <main className={styles.screen}>
        <p><Link href="/publications">К списку публикаций</Link></p>
        <h1>Пакет не найден</h1>
      </main>
    );
  }
  if (pack == null) return <main className={styles.screen}><AdminLoading label="Загружаем пакет…" /></main>;

  return (
    <main className={styles.screen}>
      <p><Link href="/publications">К списку публикаций</Link></p>
      <div className={styles.pageHead}>
        <div>
          <h1>{packTitle(pack)}</h1>
          <p className={styles.meta}>
            <span>{CHANGESET_STATUS_LABEL[pack.status]}</span>
            <span>Автор: {pack.authorLogin}</span>
            <span>Создан: {formatExactWhen(pack.createdAt)}</span>
            <span>Отправлен: {formatExactWhen(pack.submittedAt)}</span>
            <span>Обновлён: {formatExactWhen(pack.updatedAt)}</span>
          </p>
        </div>
        <div className={styles.detailActions}>
          <ChangeSetReviewDialogs
            pack={pack}
            onUpdated={(next, nextMessage) => {
              setPack(next);
              setMessage(nextMessage);
            }}
          />
        </div>
      </div>
      {pack.reviewComment ? <p className={styles.comment}>Комментарий: {pack.reviewComment}</p> : null}
      {message ? <p className={styles.status} role="status">{message}</p> : null}
      {pack.entries.map((entry) => (
        <section key={entry.id} className={styles.entry}>
          <div className={styles.entryHead}>
            <strong>{entry.entityTitle}</strong>
            <Link href={editorHref(entry.entityType, entry.entityId)}>Открыть карточку</Link>
          </div>
          {entry.fieldChanges.map((change) => (
            <article key={change.path} className={styles.change}>
              <p className={styles.path}>
                {change.location.section} → {change.location.document} → вкладка {change.location.tab} → {change.location.field}
              </p>
              {change.location.itemLabel ? <p className={styles.item}>{change.location.itemLabel}</p> : null}
              {change.before.kind === "image" || change.after.kind === "image" ? (
                <div className={styles.previews}>
                  <ImageSlot value={change.before} label="Было" />
                  <ImageSlot value={change.after} label="Стало" />
                </div>
              ) : (
                <div className={styles.values}>
                  <p><span className={styles.valueLabel}>Было</span>{formatFieldValue(change.before)}</p>
                  <p><span className={styles.valueLabel}>Стало</span>{formatFieldValue(change.after)}</p>
                </div>
              )}
            </article>
          ))}
        </section>
      ))}
    </main>
  );
}
