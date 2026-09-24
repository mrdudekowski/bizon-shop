"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { browserAdminClient } from "@/admin/client/localStore";
import type { ArticleDraft, DocumentStatus } from "@/admin/domain/types";

import styles from "./MaterialList.module.css";

const STATUS_LABEL: Record<DocumentStatus, string> = {
  draft: "черновик",
  on_site: "на сайте",
  hidden: "скрыто",
};

export function MaterialList() {
  const router = useRouter();
  const [items, setItems] = useState<
    {
      id: string;
      title: string;
      kind: ArticleDraft["kind"];
      status: DocumentStatus;
      hasUnpublishedDraft: boolean;
    }[]
  >([]);
  const [title, setTitle] = useState("");
  const [kind, setKind] = useState<ArticleDraft["kind"]>("article");

  async function reload() {
    setItems(await browserAdminClient().listMaterials());
  }

  useEffect(() => {
    void reload();
  }, []);

  return (
    <main className={styles.list}>
      <h1>Материалы</h1>
      <form
        className={styles.form}
        onSubmit={(event) => {
          event.preventDefault();
          if (!title.trim()) return;
          void browserAdminClient()
            .createMaterial({ title, kind })
            .then((created) => router.push(`/materials/${created.id}`));
        }}
      >
        <input aria-label="Название материала" value={title} onChange={(event) => setTitle(event.target.value)} />
        <select
          aria-label="Тип материала"
          value={kind}
          onChange={(event) => setKind(event.target.value as ArticleDraft["kind"])}
        >
          <option value="article">Tire IQ</option>
          <option value="story">История</option>
        </select>
        <button type="submit">Новый материал</button>
      </form>
      <ul>
        {items.map((item) => (
          <li key={item.id}>
            <a href={`/materials/${item.id}`}>{item.title}</a>
            <span>{item.kind === "story" ? "История" : "Tire IQ"}</span>
            <span>{STATUS_LABEL[item.status]}</span>
            {item.hasUnpublishedDraft ? <span>есть черновик</span> : null}
          </li>
        ))}
      </ul>
    </main>
  );
}
