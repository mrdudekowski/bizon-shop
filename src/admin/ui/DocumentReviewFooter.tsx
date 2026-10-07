"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import Link from "next/link";

import { AdminClientError } from "@/admin/client/errors";
import { ERROR_TEXT } from "@/admin/client/errorText";
import { feedbackRole } from "@/admin/client/actionFeedback";
import { browserAdminClient } from "@/admin/client/localStore";
import type { ChangeSet, StatusEntity } from "@/admin/domain/types";
import { DocumentActions, useAdminSession } from "@/admin/ui/DocumentUI";
import { focusPublishBlocker, setPublishBlockers, type PublishBlockerHint } from "@/admin/ui/documentTabs";

function formatWhen(iso: string | null): string {
  if (iso == null) return "";
  return new Date(iso).toLocaleString("ru-RU", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

function packTouches(pack: ChangeSet, entityType: StatusEntity, entityId: string): boolean {
  return pack.entries.some((entry) => entry.entityType === entityType && entry.entityId === entityId);
}

export function DocumentReviewFooter({
  entityType,
  entityId,
  dirty,
  saving,
  message,
  blockers = [],
  extraFeedback,
  lastSavedBy,
  lastPublishedBy,
  onSave,
  adminActions,
}: {
  entityType: StatusEntity;
  entityId: string;
  dirty: boolean;
  saving: boolean;
  message?: string;
  blockers?: PublishBlockerHint[];
  extraFeedback?: ReactNode;
  lastSavedBy?: string | null;
  lastPublishedBy?: string | null;
  onSave: () => Promise<void>;
  adminActions?: ReactNode;
}) {
  const session = useAdminSession();
  const [packs, setPacks] = useState<ChangeSet[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [localMessage, setLocalMessage] = useState("");

  const reload = useCallback(async () => {
    try {
      setPacks(await browserAdminClient().listChangeSets());
    } catch {
      setPacks([]);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload, lastSavedBy]);

  useEffect(() => {
    setPublishBlockers(blockers);
  }, [blockers]);

  useEffect(() => () => setPublishBlockers([]), []);

  const ownOpenPacks = packs.filter((pack) => (pack.status === "open" || pack.status === "returned") && pack.authorLogin === session?.login);
  const ownOpen = ownOpenPacks.find((pack) => packTouches(pack, entityType, entityId)) ?? ownOpenPacks[0];
  const ownPending = packs.find((pack) => pack.status === "pending_review" && pack.authorLogin === session?.login && packTouches(pack, entityType, entityId));
  const foreignPending = packs.find((pack) => pack.status === "pending_review" && packTouches(pack, entityType, entityId) && pack.authorLogin !== session?.login);
  const canSubmit = ownOpen != null && ownOpen.entries.some((entry) => entry.fieldChanges.length > 0) && !dirty;
  const role = session?.role ?? "editor";

  async function save() {
    setLocalMessage("");
    await onSave();
    await reload();
  }

  async function submit() {
    if (ownOpen == null) return;
    setSubmitting(true);
    setLocalMessage("");
    try {
      await browserAdminClient().submitChangeSet(ownOpen.id);
      await reload();
    } catch (error) {
      setLocalMessage(error instanceof AdminClientError ? ERROR_TEXT[error.code] : "Не удалось отправить");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <DocumentActions>
      {lastSavedBy != null ? <p>Сохранил: {lastSavedBy || "—"}</p> : null}
      {lastPublishedBy != null ? <p>Опубликовал: {lastPublishedBy || "—"}</p> : null}
      {message ? <p role={feedbackRole(message)}>{message}</p> : null}
      {localMessage ? <p role={feedbackRole(localMessage)}>{localMessage}</p> : null}
      {blockers.map((blocker) => (
        <p key={blocker.text}>
          <button type="button" className="blockerLink" onClick={() => focusPublishBlocker(blocker)}>
            {blocker.text}
          </button>
        </p>
      ))}
      {extraFeedback}
      {dirty ? <p>Есть несохранённые правки</p> : null}
      {role === "editor" && ownOpen?.status === "returned" && ownOpen.reviewComment ? (
        <p>Вернули на доработку: {ownOpen.reviewComment}</p>
      ) : null}
      {role === "editor" && ownPending ? <p>Отправлено на одобрение {formatWhen(ownPending.submittedAt)}.</p> : null}
      {role === "editor" && !ownPending ? <p>Черновик сохранён. На сайт не попадёт, пока администратор не одобрит.</p> : null}
      {role === "admin" && foreignPending ? (
        <p>
          Эту карточку отправил на одобрение {foreignPending.authorLogin}.{" "}
          <Link href={`/publications/${foreignPending.id}`}>Открыть пакет</Link>
        </p>
      ) : null}
      <button type="button" disabled={saving} onClick={() => void save()}>
        {saving ? "Сохраняем…" : "Сохранить"}
      </button>
      {role === "editor" ? (
        <button type="button" disabled={!canSubmit || submitting} onClick={() => void submit()}>
          {submitting ? "Отправляем…" : "Отправить на одобрение"}
        </button>
      ) : null}
      {role === "admin" ? adminActions : null}
    </DocumentActions>
  );
}
