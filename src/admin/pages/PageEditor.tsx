"use client";

import { useEffect, useState } from "react";

import { browserAdminClient } from "@/admin/client/localStore";
import { AdminClientError } from "@/admin/client/errors";
import type { AdminRole, EntityRecord, PageDraft, PageKey } from "@/admin/domain/types";

import { PAGE_LABELS } from "./pageLabels";

export function PageEditor({ pageKey }: { pageKey: PageKey }) {
  const [record, setRecord] = useState<EntityRecord<PageDraft> | null>(null);
  const [role, setRole] = useState<AdminRole>("admin");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);

  useEffect(() => {
    const client = browserAdminClient();
    void Promise.all([client.getSession(), client.getPage(pageKey)]).then(([session, page]) => {
      setRole(session.role);
      setRecord(page);
    });
  }, [pageKey]);

  if (record == null) return <main>Загрузка…</main>;
  const draft = record.draft;
  const dirty = JSON.stringify(draft) !== JSON.stringify(record.savedDraft);

  function patchSeo(next: Partial<Pick<PageDraft, "seoTitle" | "seoDescription">>) {
    setRecord({ ...record!, draft: { ...draft, ...next } });
  }

  function patchHero(next: Partial<PageDraft["hero"]>) {
    setRecord({ ...record!, draft: { ...draft, hero: { ...draft.hero, ...next } } as PageDraft });
  }

  async function onSave() {
    setSaving(true);
    setMessage("");
    try {
      setRecord(await browserAdminClient().savePage(pageKey, draft));
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
      setRecord(await browserAdminClient().publishPage(pageKey));
    } catch (error) {
      setMessage(error instanceof AdminClientError ? error.code : "error");
    } finally {
      setPublishing(false);
    }
  }

  async function onReset() {
    setRecord(await browserAdminClient().resetPage(pageKey));
  }

  return (
    <main>
      <h1>{PAGE_LABELS[pageKey]}</h1>
      <label>
        SEO title
        <input value={draft.seoTitle} onChange={(event) => patchSeo({ seoTitle: event.target.value })} />
      </label>
      <label>
        SEO description
        <textarea
          value={draft.seoDescription}
          onChange={(event) => patchSeo({ seoDescription: event.target.value })}
        />
      </label>
      <label>
        Надзаголовок
        <input value={draft.hero.eyebrow} onChange={(event) => patchHero({ eyebrow: event.target.value })} />
      </label>
      <label>
        Заголовок
        <input value={draft.hero.title} onChange={(event) => patchHero({ title: event.target.value })} />
      </label>
      <label>
        Лид
        <textarea value={draft.hero.lead} onChange={(event) => patchHero({ lead: event.target.value })} />
      </label>
      <div>
        {message ? <p>{message}</p> : null}
        {dirty ? <p>Есть несохранённые правки</p> : null}
        <button type="button" disabled={saving} onClick={() => void onSave()}>
          {saving ? "Сохраняем…" : "Сохранить"}
        </button>
        {role === "admin" ? (
          <>
            <button type="button" disabled={dirty || publishing} onClick={() => void onPublish()}>
              {publishing ? "Публикуем…" : "Опубликовать"}
            </button>
            <button type="button" onClick={() => void onReset()}>
              Сбросить публикацию
            </button>
          </>
        ) : null}
      </div>
    </main>
  );
}
