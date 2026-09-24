"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { AdminClientError } from "@/admin/client/errors";
import { browserAdminClient } from "@/admin/client/localStore";
import { articlePublishBlockers } from "@/admin/domain/publishRules";
import type { AdminRole, ArticleDraft, EntityRecord } from "@/admin/domain/types";
import { PlacementFields } from "@/admin/media/PlacementFields";

import styles from "./MaterialEditor.module.css";

const BLOCKER_TEXT: Record<string, string> = {
  title: "Укажите название",
  slug: "Укажите slug",
  body: "Добавьте текст",
};

export function MaterialEditor({ id }: { id: string }) {
  const router = useRouter();
  const [record, setRecord] = useState<EntityRecord<ArticleDraft> | null>(null);
  const [role, setRole] = useState<AdminRole>("admin");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);

  useEffect(() => {
    const client = browserAdminClient();
    void Promise.all([client.getSession(), client.getMaterial(id)]).then(([session, material]) => {
      setRole(session.role);
      setRecord(material);
    });
  }, [id]);

  if (record == null) return <main>Загрузка…</main>;
  const draft = record.draft;
  const dirty = JSON.stringify(draft) !== JSON.stringify(record.savedDraft);
  const blockers = articlePublishBlockers(draft);
  const savedBlockers = record.savedDraft == null ? [] : articlePublishBlockers(record.savedDraft);

  function patch(next: Partial<ArticleDraft>) {
    setRecord({ ...record!, draft: { ...draft, ...next } });
  }

  function moveGallery(index: number, delta: -1 | 1) {
    const target = index + delta;
    if (target < 0 || target >= draft.gallery.length) return;
    const gallery = draft.gallery.slice();
    const [item] = gallery.splice(index, 1);
    gallery.splice(target, 0, item);
    patch({ gallery });
  }

  async function onSave() {
    setSaving(true);
    setMessage("");
    try {
      setRecord(await browserAdminClient().saveMaterial(id, draft));
    } catch (error) {
      setMessage(error instanceof AdminClientError ? error.code : "error");
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
      setMessage(error instanceof AdminClientError ? error.code : "error");
    } finally {
      setPublishing(false);
    }
  }

  return (
    <main className={styles.editor}>
      <h1>{draft.title || "Материал"}</h1>
      <label>
        Название
        <input value={draft.title} onChange={(event) => patch({ title: event.target.value })} />
      </label>
      <label>
        Slug
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
        <h2>Медиа</h2>
        <PlacementFields
          label="Главное фото"
          value={draft.image}
          onChange={(image) => patch({ image })}
        />
        <h3>Галерея</h3>
        {draft.gallery.map((item, index) => (
          <div key={`${item.assetId}-${index}`} className={styles.row}>
            <PlacementFields
              label={`Галерея ${index + 1}`}
              value={item}
              onChange={(next) => {
                if (next == null) {
                  patch({ gallery: draft.gallery.filter((_, i) => i !== index) });
                  return;
                }
                const gallery = draft.gallery.slice();
                gallery[index] = next;
                patch({ gallery });
              }}
            />
            <button type="button" disabled={index === 0} onClick={() => moveGallery(index, -1)}>
              выше
            </button>
            <button
              type="button"
              disabled={index === draft.gallery.length - 1}
              onClick={() => moveGallery(index, 1)}
            >
              ниже
            </button>
          </div>
        ))}
        <PlacementFields
          label="Добавить в галерею"
          value={undefined}
          onChange={(next) => {
            if (next == null) return;
            patch({ gallery: [...draft.gallery, next] });
          }}
        />
      </section>
      <div className={styles.actions}>
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
            <button type="button" onClick={() => void browserAdminClient().hideMaterial(id).then(setRecord)}>
              Скрыть с сайта
            </button>
            {record.publishedSnapshot == null ? (
              <button
                type="button"
                onClick={() => void browserAdminClient().deleteMaterial(id).then(() => router.push("/materials"))}
              >
                Удалить
              </button>
            ) : null}
          </>
        ) : null}
        {blockers.length > 0 && record.savedDraft == null ? <p>Сначала сохраните черновик</p> : null}
      </div>
    </main>
  );
}
