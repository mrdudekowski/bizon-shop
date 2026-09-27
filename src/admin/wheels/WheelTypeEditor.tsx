"use client";

import { DocumentActions, useAdminRole } from "@/admin/ui/DocumentUI";
import { AdminLoading } from "@/admin/ui/AdminLoading";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { browserAdminClient } from "@/admin/client/localStore";
import { AdminClientError } from "@/admin/client/errors";
import { wheelTypePublishBlockers } from "@/admin/domain/publishRules";
import type { EntityRecord, WheelTypeDraft } from "@/admin/domain/types";
import { PlacementFields } from "@/admin/media/PlacementFields";

import styles from "./WheelDocument.module.css";

const ERROR_TEXT: Record<AdminClientError["code"], string> = {
  slug_taken: "Этот адрес страницы уже занят",
  invalid_slug: "Нельзя изменить адрес страницы",
  publish_blocked: "Публикация закрыта",
  category_not_published: "Сначала опубликуйте категорию товара",
  category_has_published_products: "Сначала снимите с публикации товары этой категории",
  unsaved: "Сначала сохраните черновик",
  media_in_use: "Файл ещё используется",
  storage_unavailable: "Хранилище S3 не настроено",
  cannot_disable_self: "Нельзя отключить себя",
  last_admin: "Нельзя отключить последнего администратора",
  invalid_credentials: "Неверный логин или пароль",
  unauthorized: "Сессия закончилась. Войдите снова",
  forbidden: "Недостаточно прав для этого действия",
};

const BLOCKER_TEXT: Record<string, string> = {
  name: "Укажите название",
  slug: "Укажите адрес страницы",
  mainImage: "Добавьте главное фото",
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
      const published = await browserAdminClient().publishWheelType(id);
      setRecord(published);
      setDraft(published.draft);
    } catch (error) {
      setMessage(error instanceof AdminClientError ? ERROR_TEXT[error.code] : "Не удалось опубликовать");
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
          : "Не удалось удалить",
      );
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
      <DocumentActions>
        <p>Сохранил: {record.lastSavedBy ?? "—"}</p>
        <p>Опубликовал: {record.lastPublishedBy ?? "—"}</p>
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
              <button type="button" onClick={() => void browserAdminClient().hideWheelType(id).then(setRecord)}>
                Скрыть с сайта
              </button>
            ) : (
              <button
                type="button"
                onClick={() => void onDelete()}
              >
                Удалить
              </button>
            )}
          </>
        ) : null}
      </DocumentActions>
    </main>
  );
}
