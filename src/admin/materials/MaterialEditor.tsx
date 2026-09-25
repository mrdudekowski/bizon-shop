"use client";

import { BlockNav, DocumentActions, useAdminRole } from "@/admin/ui/DocumentUI";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { AdminClientError } from "@/admin/client/errors";
import { browserAdminClient } from "@/admin/client/localStore";
import { articlePublishBlockers } from "@/admin/domain/publishRules";
import type { ArticleDraft, EntityRecord } from "@/admin/domain/types";
import { PlacementFields } from "@/admin/media/PlacementFields";

import styles from "./MaterialEditor.module.css";

const ERROR_TEXT: Record<AdminClientError["code"], string> = {
  slug_taken: "Этот адрес страницы уже занят",
  invalid_slug: "Нельзя изменить адрес страницы",
  publish_blocked: "Публикация закрыта",
  unsaved: "Сначала сохраните черновик",
  media_in_use: "Файл ещё используется",
  cannot_disable_self: "Нельзя отключить себя",
  last_admin: "Нельзя отключить последнего администратора",
};

const BLOCKER_TEXT: Record<string, string> = {
  title: "Укажите название",
  slug: "Укажите адрес страницы",
  body: "Добавьте текст",
};

export function MaterialEditor({ id }: { id: string }) {
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

  if (record == null) return <main>Загрузка…</main>;
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
    } catch (error) {
      setMessage(error instanceof AdminClientError ? ERROR_TEXT[error.code] : "Не удалось сохранить");
    } finally {
      setSaving(false);
    }
  }

  async function onPublish() {
    setPublishing(true);
    setMessage("");
    try {
      setRecord(await browserAdminClient().publishMaterial(id));
    } catch (error) {
      setMessage(error instanceof AdminClientError ? ERROR_TEXT[error.code] : "Не удалось опубликовать");
    } finally {
      setPublishing(false);
    }
  }

  return (
    <main className="document">
      <h1>{draft.title || "Материал"}</h1>
      <BlockNav />
      <label>
        Название
        <input value={draft.title} onChange={(event) => patch({ title: event.target.value })} />
      </label>
      <label>
        Адрес страницы
        <input
          value={draft.slug}
          disabled={record.slugLocked}
          onChange={(event) => patch({ slug: event.target.value })}
        />
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
        <input
          type="checkbox"
          checked={draft.showInMenu}
          onChange={(event) => patch({ showInMenu: event.target.checked })}
        />
        Показывать в меню
      </label>
      <label>
        Порядок в меню
        <input
          type="number"
          value={draft.menuOrder}
          onChange={(event) => patch({ menuOrder: Number(event.target.value) })}
        />
      </label>
      {draft.kind === "story" ? (
        <>
          <label>
            Клиент
            <input value={draft.clientName} onChange={(event) => patch({ clientName: event.target.value })} />
          </label>
          <label>
            Отрасль
            <input value={draft.industry} onChange={(event) => patch({ industry: event.target.value })} />
          </label>
        </>
      ) : null}
      <section className={styles.section}>
        <h2>Фото</h2>
        <PlacementFields
          label="Главное фото"
          value={draft.image}
          onChange={(image) => patch({ image })}
        />
        </section>
      <DocumentActions>
        {message ? <p>{message}</p> : null}
        {savedBlockers.map((code) => (
          <p key={code}>{BLOCKER_TEXT[code] ?? code}</p>
        ))}
        {dirty ? <p>Есть несохранённые правки</p> : null}
        <button type="button" disabled={saving} onClick={() => void onSave()}>
          {saving ? "Сохраняем…" : "Сохранить"}
        </button>
        {role === "admin" ? (
          <>
            <button
              type="button"
              disabled={dirty || publishing || savedBlockers.length > 0}
              onClick={() => void onPublish()}
            >
              {publishing ? "Публикуем…" : "Опубликовать"}
            </button>
            {record.publishedSnapshot != null ? (
              <button type="button" onClick={() => void browserAdminClient().hideMaterial(id).then(setRecord)}>
                Скрыть с сайта
              </button>
            ) : (
              <button
                type="button"
                onClick={() => void browserAdminClient().deleteMaterial(id).then(() => router.push("/materials"))}
              >
                Удалить
              </button>
            )}
          </>
        ) : null}
        {blockers.length > 0 && record.savedDraft == null ? <p>Сначала сохраните черновик</p> : null}
      </DocumentActions>
    </main>
  );
}
