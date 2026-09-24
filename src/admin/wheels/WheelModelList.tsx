"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { browserAdminClient } from "@/admin/client/localStore";
import type { DocumentStatus, EntityRecord, WheelTypeDraft } from "@/admin/domain/types";

import styles from "./WheelDocument.module.css";

const STATUS_LABEL: Record<DocumentStatus, string> = {
  draft: "черновик",
  on_site: "на сайте",
  hidden: "скрыто",
};

export function WheelModelList() {
  const router = useRouter();
  const [types, setTypes] = useState<EntityRecord<WheelTypeDraft>[]>([]);
  const [models, setModels] = useState<{ id: string; name: string; typeName: string; status: DocumentStatus }[]>([]);
  const [name, setName] = useState("");
  const [wheelTypeId, setWheelTypeId] = useState("");
  const [typeName, setTypeName] = useState("");

  async function reload() {
    const client = browserAdminClient();
    const [nextTypes, nextModels] = await Promise.all([client.listWheelTypes(), client.listWheelModels()]);
    setTypes(nextTypes);
    setModels(nextModels);
    setWheelTypeId((current) => current || nextTypes[0]?.id || "");
  }

  useEffect(() => {
    void reload();
  }, []);

  return (
    <main className={styles.page}>
      <h1>Диски</h1>
      <form
        className={styles.section}
        onSubmit={(event) => {
          event.preventDefault();
          if (!typeName.trim()) return;
          void browserAdminClient()
            .createWheelType({ name: typeName })
            .then((created) => router.push(`/wheels/types/${created.id}`));
        }}
      >
        <label className={styles.field}>
          Новый тип диска
          <input
            aria-label="Новый тип диска"
            value={typeName}
            onChange={(event) => setTypeName(event.target.value)}
          />
        </label>
        <button type="submit">Новый тип</button>
      </form>
      <ul className={styles.section}>
        {types.map((type) => (
          <li key={type.id}>
            <a href={`/wheels/types/${type.id}`}>{type.draft.name}</a> <span>{type.draft.slug}</span>
          </li>
        ))}
      </ul>
      <form
        className={styles.section}
        onSubmit={(event) => {
          event.preventDefault();
          if (!name.trim() || !wheelTypeId) return;
          void browserAdminClient()
            .createWheelModel({ name, wheelTypeId })
            .then((created) => router.push(`/wheels/${created.id}`));
        }}
      >
        <label className={styles.field}>
          Название модели диска
          <input
            aria-label="Название модели диска"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        </label>
        <label className={styles.field}>
          Тип диска
          <select
            aria-label="Тип диска"
            value={wheelTypeId}
            onChange={(event) => setWheelTypeId(event.target.value)}
          >
            {types.map((type) => (
              <option key={type.id} value={type.id}>
                {type.draft.name}
              </option>
            ))}
          </select>
        </label>
        <button type="submit">Новая модель</button>
      </form>
      <ul className={styles.section}>
        {models.map((model) => (
          <li key={model.id}>
            <a href={`/wheels/${model.id}`}>{model.name}</a>
            <span> {model.typeName} </span>
            <span>{STATUS_LABEL[model.status]}</span>
          </li>
        ))}
      </ul>
    </main>
  );
}
