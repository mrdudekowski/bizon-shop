"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { browserAdminClient } from "@/admin/client/localStore";
import type { DocumentStatus, TireDirection, TireModelListItem } from "@/admin/domain/types";

const STATUS_LABEL: Record<DocumentStatus, string> = {
  draft: "черновик",
  on_site: "на сайте",
  hidden: "скрыто",
};

export function TireModelList() {
  const router = useRouter();
  const [items, setItems] = useState<TireModelListItem[]>([]);
  const [directions, setDirections] = useState<TireDirection[]>([]);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"all" | "on_site" | "hidden">("all");
  const [name, setName] = useState("");
  const [directionId, setDirectionId] = useState("");

  async function reload() {
    const client = browserAdminClient();
    const [models, dirs] = await Promise.all([client.listTireModels(), client.listTireDirections()]);
    setItems(models);
    setDirections(dirs);
    setDirectionId((current) => current || dirs[0]?.id || "");
  }

  useEffect(() => {
    void reload();
  }, []);

  const visible = items.filter((item) => {
    const matchesName = item.name.toLocaleLowerCase("ru-RU").includes(query.trim().toLocaleLowerCase("ru-RU"));
    const matchesStatus = status === "all" || item.status === status;
    return matchesName && matchesStatus;
  });

  async function createModel() {
    if (!name.trim() || !directionId) return;
    const created = await browserAdminClient().createTireModel({ name, directionId });
    router.push(`/tires/${created.id}`);
  }

  return (
    <main>
      <h1>Модели шин</h1>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          void createModel();
        }}
      >
        <input aria-label="Название новой модели" value={name} onChange={(event) => setName(event.target.value)} />
        <select aria-label="Направление" value={directionId} onChange={(event) => setDirectionId(event.target.value)}>
          {directions.map((direction) => (
            <option key={direction.id} value={direction.id}>
              {direction.name}
            </option>
          ))}
        </select>
        <button type="submit">Новая модель</button>
      </form>
      <input aria-label="Поиск по названию" value={query} onChange={(event) => setQuery(event.target.value)} />
      <select aria-label="Статус" value={status} onChange={(event) => setStatus(event.target.value as typeof status)}>
        <option value="all">все</option>
        <option value="on_site">на сайте</option>
        <option value="hidden">скрыто</option>
      </select>
      <ul>
        {visible.map((item) => (
          <li key={item.id}>
            <a href={`/tires/${item.id}`}>{item.name}</a>
            <span>{item.directionName}</span>
            <span>{item.sizeCount}</span>
            <span>{STATUS_LABEL[item.status]}</span>
            {item.hasUnpublishedDraft ? <span>есть черновик</span> : null}
          </li>
        ))}
      </ul>
    </main>
  );
}
