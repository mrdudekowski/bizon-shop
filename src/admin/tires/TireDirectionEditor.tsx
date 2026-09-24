"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { browserAdminClient } from "@/admin/client/localStore";
import { AdminClientError } from "@/admin/client/errors";
import {
  OPERATING_CONDITION_OPTIONS,
  VEHICLE_TYPE_OPTIONS,
  type OperatingCondition,
  type VehicleType,
} from "@/admin/domain/options";
import { tireDirectionPublishBlockers } from "@/admin/domain/publishRules";
import type { AdminRole, EntityRecord, TireDirectionDraft } from "@/admin/domain/types";
import { PlacementFields } from "@/admin/media/PlacementFields";

const ERROR_TEXT: Record<AdminClientError["code"], string> = {
  slug_taken: "Такой slug уже занят",
  invalid_slug: "Slug нельзя изменить",
  publish_blocked: "Публикация закрыта",
  unsaved: "Сначала сохраните черновик",
  media_in_use: "Файл ещё используется",
  cannot_disable_self: "Нельзя отключить себя",
  last_admin: "Нельзя отключить последнего администратора",
};

const BLOCKER_TEXT: Record<string, string> = {
  name: "Укажите название",
  slug: "Укажите slug",
  mainImage: "Добавьте главное фото",
};

export function TireDirectionEditor({ id }: { id: string }) {
  const router = useRouter();
  const [record, setRecord] = useState<EntityRecord<TireDirectionDraft> | null>(null);
  const [draft, setDraft] = useState<TireDirectionDraft | null>(null);
  const [role, setRole] = useState<AdminRole>("admin");
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const client = browserAdminClient();
    void Promise.all([client.getTireDirection(id), client.getSession()]).then(([nextRecord, session]) => {
      setRecord(nextRecord);
      setDraft(nextRecord.draft);
      setRole(session.role);
    });
  }, [id]);

  if (draft == null || record == null) return <main>Загрузка…</main>;

  const dirty = JSON.stringify(draft) !== JSON.stringify(record.savedDraft) || record.savedDraft == null;
  const blockers = tireDirectionPublishBlockers(draft);
  const savedBlockers = record.savedDraft == null ? [] : tireDirectionPublishBlockers(record.savedDraft);

  function patch(next: Partial<TireDirectionDraft>) {
    setDraft((current) => (current == null ? current : { ...current, ...next }));
  }

  function toggle<T extends string>(list: T[], value: T): T[] {
    return list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
  }

  async function onSave() {
    setSaving(true);
    setMessage("");
    try {
      const saved = await browserAdminClient().saveTireDirection(id, draft!);
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
      const published = await browserAdminClient().publishTireDirection(id);
      setRecord(published);
      setDraft(published.draft);
    } catch (error) {
      setMessage(error instanceof AdminClientError ? ERROR_TEXT[error.code] : "Не удалось опубликовать");
    } finally {
      setPublishing(false);
    }
  }

  async function onHide() {
    const hidden = await browserAdminClient().hideTireDirection(id);
    setRecord(hidden);
  }

  async function onDelete() {
    await browserAdminClient().deleteTireDirection(id);
    router.push("/tires/directions");
  }

  return (
    <main>
      <h1>{draft.name || "Направление шины"}</h1>
      <section>
        <h2>Карточка</h2>
        <label>
          Название
          <input value={draft.name} onChange={(event) => patch({ name: event.target.value })} />
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
          Описание
          <textarea value={draft.description} onChange={(event) => patch({ description: event.target.value })} />
        </label>
        <label>
          Короткое описание
          <textarea
            value={draft.shortDescription}
            onChange={(event) => patch({ shortDescription: event.target.value })}
          />
        </label>
        <label>
          Порядок
          <input
            type="number"
            value={draft.sortOrder}
            onChange={(event) => patch({ sortOrder: Number(event.target.value) || 0 })}
          />
        </label>
        <label>
          <input
            type="checkbox"
            checked={draft.showInMenu}
            onChange={(event) => patch({ showInMenu: event.target.checked })}
          />
          Показывать в меню
        </label>
      </section>
      <section>
        <h2>Подбор</h2>
        {VEHICLE_TYPE_OPTIONS.map((option) => (
          <label key={option.value}>
            <input
              type="checkbox"
              checked={draft.selectionVehicleTypes.includes(option.value)}
              onChange={() =>
                patch({ selectionVehicleTypes: toggle<VehicleType>(draft.selectionVehicleTypes, option.value) })
              }
            />
            {option.label}
          </label>
        ))}
        {OPERATING_CONDITION_OPTIONS.map((option) => (
          <label key={option.value}>
            <input
              type="checkbox"
              checked={draft.selectionConditions.includes(option.value)}
              onChange={() =>
                patch({ selectionConditions: toggle<OperatingCondition>(draft.selectionConditions, option.value) })
              }
            />
            {option.label}
          </label>
        ))}
      </section>
      <section>
        <h2>Медиа</h2>
        <PlacementFields
          label="Главное фото"
          value={draft.mainImage}
          onChange={(mainImage) => patch({ mainImage })}
        />
      </section>
      <div>
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
              <button type="button" onClick={() => void onHide()}>
                Скрыть с сайта
              </button>
            ) : (
              <button type="button" onClick={() => void onDelete()}>
                Удалить
              </button>
            )}
          </>
        ) : null}
      </div>
    </main>
  );
}
