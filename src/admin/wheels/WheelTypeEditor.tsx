"use client";

import { useAdminRole } from "@/admin/ui/DocumentUI";
import { DocumentReviewFooter } from "@/admin/ui/DocumentReviewFooter";
import { AdminLoading } from "@/admin/ui/AdminLoading";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { browserAdminClient } from "@/admin/client/localStore";
import { AdminClientError } from "@/admin/client/errors";
import { DOCUMENT_STATUS, actionErrorText } from "@/admin/client/actionFeedback";
import { wheelTypePublishBlockers } from "@/admin/domain/publishRules";
import type { EntityRecord, WheelTypeDraft } from "@/admin/domain/types";
import { PlacementFields } from "@/admin/media/PlacementFields";

import type { PublishBlockerHint } from "@/admin/ui/documentTabs";

import styles from "./WheelDocument.module.css";

const BLOCKER_TEXT: Record<string, PublishBlockerHint> = {
  name: { text: "Укажите название", tab: "Карточка", field: "Название" },
  slug: { text: "Укажите адрес страницы", tab: "Карточка", field: "Адрес" },
  mainImage: { text: "Добавьте главное фото", tab: "Фото", anchor: "main" },
};

export function WheelTypeEditor({ id }: { id: string }) {
  const router = useRouter();
  const [record, setRecord] = useState<EntityRecord<WheelTypeDraft> | null>(null);
  const [draft, setDraft] = useState<WheelTypeDraft | null>(null);
  const [role, setRole] = useAdminRole();
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [message, setMessage] = useState("");
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    const client = browserAdminClient();
    void Promise.all([client.getWheelType(id), client.getSession()])
      .then(([next, session]) => {
        setRecord(next);
        setDraft(next.draft);
        setRole(session.role);
      })
      .catch(() => setMissing(true));
  }, [id, setRole]);

  if (missing) return <main className={styles.page}>Тип не найден</main>;
  if (draft == null || record == null) return <main className={styles.page}><AdminLoading /></main>;

  const dirty = JSON.stringify(draft) !== JSON.stringify(record.savedDraft) || record.savedDraft == null;
  const savedBlockers = record.savedDraft == null ? [] : wheelTypePublishBlockers(record.savedDraft);

  function patch(next: Partial<WheelTypeDraft>) {
    setDraft((current) => (current == null ? current : { ...current, ...next }));
  }

  async function onSave() {
    setSaving(true);
    setMessage("");
    try {
      const saved = await browserAdminClient().saveWheelType(id, draft!);
      setRecord(saved);
      setDraft(saved.draft);
      setMessage(DOCUMENT_STATUS.saved);
    } catch (error) {
      setMessage(actionErrorText(error, "Не удалось сохранить"));
    } finally {
      setSaving(false);
    }
  }

  async function onPublish() {
    setPublishing(true);
    setMessage("");
    try {
      const published = await browserAdminClient().publishWheelType(id);
      setRecord(published);
      setDraft(published.draft);
      setMessage(DOCUMENT_STATUS.published);
    } catch (error) {
      setMessage(actionErrorText(error, "Не удалось опубликовать"));
    } finally {
      setPublishing(false);
    }
  }

  async function onDelete() {
    try {
      await browserAdminClient().deleteWheelType(id);
      router.push("/wheels");
    } catch (error) {
      setMessage(
        error instanceof AdminClientError && error.code === "publish_blocked"
          ? "Нельзя удалить: есть связанные записи"
          : actionErrorText(error, "Не удалось удалить"),
      );
    }
  }

  async function onHide() {
    try {
      setRecord(await browserAdminClient().hideWheelType(id));
      setMessage(DOCUMENT_STATUS.hidden);
    } catch (error) {
      setMessage(actionErrorText(error, "Не удалось скрыть"));
    }
  }

  return (
    <main className="document" data-unsaved={dirty ? "true" : undefined}>
      <Link className="backLink" href="/wheels">← Назад к типам дисков</Link>
      <h1>{draft.name || "Тип диска"}</h1>
      <section className={styles.section}>
        <h2>Карточка</h2>
        <label className={styles.field}>
          Название
          <input value={draft.name} onChange={(event) => patch({ name: event.target.value })} />
        </label>
        <label className={styles.field}>
          Адрес
          <input
            value={draft.slug}
            disabled={record.slugLocked}
            onChange={(event) => patch({ slug: event.target.value })}
          />
        </label>
        <label className={styles.field}>
          Описание
          <textarea value={draft.description} onChange={(event) => patch({ description: event.target.value })} />
        </label>
        <label className={styles.field}>
          Порядок
          <input
            type="number"
            value={draft.sortOrder}
            onChange={(event) => patch({ sortOrder: Number(event.target.value) || 0 })}
          />
        </label>
        <label className={styles.check}>
          <input
            type="checkbox"
            checked={draft.showInMenu}
            onChange={(event) => patch({ showInMenu: event.target.checked })}
          />
          Показывать в меню
        </label>
      </section>
      <section className={styles.section}>
        <h2>Фото</h2>
        <PlacementFields
          label="Главное фото"
          value={draft.mainImage}
          onChange={(mainImage) => patch({ mainImage })}
        />
      </section>
      <DocumentReviewFooter
        entityType="wheel-type"
        entityId={id}
        dirty={dirty}
        saving={saving}
        message={message}
        blockers={savedBlockers.map((code) => BLOCKER_TEXT[code] ?? { text: code })}
        lastSavedBy={record.lastSavedBy}
        lastPublishedBy={record.lastPublishedBy}
        onSave={onSave}
        adminActions={
          <>
            <button
              type="button"
              disabled={dirty || publishing || savedBlockers.length > 0}
              onClick={() => void onPublish()}
            >
              {publishing ? "Публикуем…" : "Опубликовать"}
            </button>
            {record.publishedSnapshot != null ? (
              <button type="button" onClick={() => void onHide()}>
                Скрыть с сайта
              </button>
            ) : (
              <button type="button" onClick={() => void onDelete()}>
                Удалить
              </button>
            )}
          </>
        }
      />
    </main>
  );
}
