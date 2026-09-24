"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { browserAdminClient } from "@/admin/client/localStore";
import type { DocumentStatus, TireDirection } from "@/admin/domain/types";

const STATUS_LABEL: Record<DocumentStatus, string> = {
  draft: "черновик",
  on_site: "на сайте",
  hidden: "скрыто",
};

export function TireDirectionList() {
  const router = useRouter();
  const [directions, setDirections] = useState<TireDirection[]>([]);
  const [name, setName] = useState("");

  async function reload() {
    setDirections(await browserAdminClient().listTireDirections());
  }

  useEffect(() => {
    void reload();
  }, []);

  async function createDirection() {
    if (!name.trim()) return;
    const created = await browserAdminClient().createTireDirection({ name });
    router.push(`/tires/directions/${created.id}`);
  }

  return (
    <main>
      <h1>Направления шин</h1>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          void createDirection();
        }}
      >
        <input
          aria-label="Название нового направления"
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
        <button type="submit">Новое направление</button>
      </form>
      <ul>
        {directions.map((direction) => (
          <li key={direction.id}>
            <a href={`/tires/directions/${direction.id}`}>{direction.name}</a>
            <span>{direction.slug}</span>
            <span>{STATUS_LABEL[direction.status]}</span>
            {direction.hasUnpublishedDraft ? <span>есть черновик</span> : null}
          </li>
        ))}
      </ul>
    </main>
  );
}
