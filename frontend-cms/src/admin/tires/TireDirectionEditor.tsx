"use client";

import { useAdminRole } from "@/admin/ui/DocumentUI";
import { DocumentReviewFooter } from "@/admin/ui/DocumentReviewFooter";
import { AdminLoading } from "@/admin/ui/AdminLoading";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { browserAdminClient } from "@/admin/client/localStore";
import { AdminClientError } from "@/admin/client/errors";
import { ERROR_TEXT } from "@/admin/client/errorText";
import {
  OPERATING_CONDITION_OPTIONS,
  VEHICLE_TYPE_OPTIONS,
  type OperatingCondition,
  type VehicleType,
} from "@/admin/domain/options";
import { tireDirectionPublishBlockers } from "@/admin/domain/publishRules";
import type { EntityRecord, TireDirectionDraft } from "@/admin/domain/types";
import { PlacementFields } from "@/admin/media/PlacementFields";

const BLOCKER_TEXT: Record<string, string> = {
  name: "Укажите название",
  slug: "Укажите адрес страницы",
  mainImage: "Добавьте главное фото",
};

export function TireDirectionEditor({ id }: { id: string }) {
  const router = useRouter();
  const [record, setRecord] = useState<EntityRecord<TireDirectionDraft> | null>(null);
  const [draft, setDraft] = useState<TireDirectionDraft | null>(null);
  const [role, setRole] = useAdminRole();
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
  }, [id, setRole]);

  if (draft == null || record == null) return <main><AdminLoading /></main>;

  const dirty = JSON.stringify(draft) !== JSON.stringify(record.savedDraft) || record.savedDraft == null;
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
    try {
      await browserAdminClient().deleteTireDirection(id);
      router.push("/tires/directions");
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
      <Link className="backLink" href="/tires/directions">← Назад к направлениям</Link>
      <h1>{draft.name || "Направление шины"}</h1>
      <section>
        <h2>Карточка</h2>
        <label>
          Название
          <input value={draft.name} onChange={(event) => patch({ name: event.target.value })} />
        </label>
        <label>
          Адрес
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
        <p>Направление — запасной совет, если ни одна модель не подошла. Галочки модели задают саму модель.</p>
        <fieldset className="choiceGroup">
          <legend>Тип техники</legend>
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
        </fieldset>
        <fieldset className="choiceGroup">
          <legend>Условия эксплуатации</legend>
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
        </fieldset>
      </section>
      <section>
        <h2>Фото</h2>
        <PlacementFields
          label="Главное фото"
          value={draft.mainImage}
          onChange={(mainImage) => patch({ mainImage })}
        />
      </section>
      <DocumentReviewFooter
        entityType="tire-direction"
        entityId={id}
        dirty={dirty}
        saving={saving}
        message={message}
        blockers={savedBlockers.map((code) => BLOCKER_TEXT[code] ?? code)}
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
