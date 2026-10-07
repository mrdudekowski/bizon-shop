"use client";

import { useAdminRole, useAdminSession } from "@/admin/ui/DocumentUI";
import { DocumentReviewFooter } from "@/admin/ui/DocumentReviewFooter";
import { AdminLoading } from "@/admin/ui/AdminLoading";
import { SectionAccessNotice } from "@/admin/ui/SectionAccessNotice";
import { canEditorPerform } from "@/admin/domain/editorPermissions";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { DOCUMENT_STATUS, actionErrorText } from "@/admin/client/actionFeedback";
import { browserAdminClient } from "@/admin/client/localStore";
import { articlePublishBlockers } from "@/admin/domain/publishRules";
import type { ArticleDraft, EntityRecord } from "@/admin/domain/types";
import { PlacementFields } from "@/admin/media/PlacementFields";
import type { PublishBlockerHint } from "@/admin/ui/documentTabs";

import styles from "./MaterialEditor.module.css";

const BLOCKER_TEXT: Record<string, PublishBlockerHint> = {
  title: { text: "Укажите название", tab: "Карточка", field: "Название" },
  slug: { text: "Укажите адрес страницы", tab: "Карточка", field: "Адрес" },
  body: { text: "Добавьте текст", tab: "Карточка", field: "Текст" },
};

export function MaterialEditor({ id }: { id: string }) {
  const session = useAdminSession();
  const router = useRouter();
  const [record, setRecord] = useState<EntityRecord<ArticleDraft> | null>(null);
  const [role, setRole] = useAdminRole();
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);

  useEffect(() => {
    const client = browserAdminClient();
    void Promise.all([client.getSession(), client.getMaterial(id)]).then(([session, material]) => {
      setRole(session.role);
      setRecord(material);
    });
  }, [id, setRole]);

  if (session == null || record == null) return <main><AdminLoading /></main>;
  if (!canEditorPerform(session, "edit_site_pages")) return <SectionAccessNotice title="Материалы" icon="materials" />;
  const draft = record.draft;
  const dirty = JSON.stringify(draft) !== JSON.stringify(record.savedDraft);
  const blockers = articlePublishBlockers(draft);
  const savedBlockers = record.savedDraft == null ? [] : articlePublishBlockers(record.savedDraft);

  function patch(next: Partial<ArticleDraft>) {
    setRecord({ ...record!, draft: { ...draft, ...next } });
  }


  async function onSave() {
    setSaving(true);
    setMessage("");
    try {
      setRecord(await browserAdminClient().saveMaterial(id, draft));
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
      setRecord(await browserAdminClient().publishMaterial(id));
      setMessage(DOCUMENT_STATUS.published);
    } catch (error) {
      setMessage(actionErrorText(error, "Не удалось опубликовать"));
    } finally {
      setPublishing(false);
    }
  }

  async function onHide() {
    try {
      setRecord(await browserAdminClient().hideMaterial(id));
      setMessage(DOCUMENT_STATUS.hidden);
    } catch (error) {
      setMessage(actionErrorText(error, "Не удалось скрыть"));
    }
  }

  async function onDelete() {
    try {
      await browserAdminClient().deleteMaterial(id);
      router.push("/materials");
    } catch (error) {
      setMessage(actionErrorText(error, "Не удалось удалить"));
    }
  }

  return (
    <main className="document" data-unsaved={dirty ? "true" : undefined}>
      <Link className="backLink" href="/materials">← Назад к материалам</Link>
      <h1>{draft.title || "Материал"}</h1>
      <section className={styles.section}>
        <h2>Карточка</h2>
        <label>
          Название
          <input value={draft.title} onChange={(event) => patch({ title: event.target.value })} />
        </label>
        <label>
          Адрес
          <input value={draft.slug} disabled={record.slugLocked} onChange={(event) => patch({ slug: event.target.value })} />
        </label>
        <label>
          Анонс
          <textarea value={draft.excerpt} onChange={(event) => patch({ excerpt: event.target.value })} />
        </label>
        <label>
          Текст
          <textarea value={draft.body} onChange={(event) => patch({ body: event.target.value })} />
        </label>
        <label>
          <input type="checkbox" checked={draft.showInMenu} onChange={(event) => patch({ showInMenu: event.target.checked })} />
          Показывать в меню
        </label>
        <label>
          Порядок в меню
          <input type="number" value={draft.menuOrder} onChange={(event) => patch({ menuOrder: Number(event.target.value) })} />
        </label>
      </section>
      <section className={styles.section}>
        <h2>Фото</h2>
        <PlacementFields
          label="Главное фото"
          value={draft.image}
          onChange={(image) => patch({ image })}
        />
      </section>
      <DocumentReviewFooter
        entityType="material"
        entityId={id}
        dirty={dirty}
        saving={saving}
        message={message}
        blockers={[
          ...savedBlockers.map((code) => BLOCKER_TEXT[code] ?? { text: code }),
          ...(blockers.length > 0 && record.savedDraft == null ? [{ text: "Сначала сохраните черновик" }] : []),
        ]}
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
