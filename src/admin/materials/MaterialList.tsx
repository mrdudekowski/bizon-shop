"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { browserAdminClient } from "@/admin/client/localStore";
import type { ArticleDraft, DocumentStatus } from "@/admin/domain/types";

import styles from "@/admin/ui/catalog.module.css";
import { Icon } from "@/admin/ui/Icon";

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
    <main>
      <div><h1>Материалы</h1><p className="subheading">Экспертные статьи Tire IQ и истории клиентов.</p></div>
      <form
        className={styles.createForm}
        onSubmit={(event) => {
          event.preventDefault();
          if (!title.trim()) return;
          void browserAdminClient()
            .createMaterial({ title, kind })
            .then((created) => router.push(`/materials/${created.id}`));
        }}
      >
        <label>Название<input placeholder="Название нового материала" aria-label="Название материала" value={title} onChange={(event) => setTitle(event.target.value)} /></label>
        <label>Тип материала<select
          aria-label="Тип материала"
          value={kind}
          onChange={(event) => setKind(event.target.value as ArticleDraft["kind"])}
        >
          <option value="article">Tire IQ</option>
          <option value="story">История</option>
        </select></label>
        <button className="primary" type="submit">Добавить материал</button>
      </form>
      {items.length === 0 ? <div className={styles.empty}><Icon name="materials" size={36} /><h2>Здесь будут ваши материалы</h2><p>Создайте статью или историю клиента с помощью формы выше.</p></div> : <div className={styles.tableWrap}><table className={styles.table}><thead><tr><th>Название</th><th>Тип</th><th>Статус</th><th><span className={styles.srOnly}>Открыть</span></th></tr></thead><tbody>
        {items.map((item) => (
          <tr key={item.id}><td><a className={styles.nameLink} href={`/materials/${item.id}`}>{item.title}</a>{item.hasUnpublishedDraft ? <span className={styles.meta}>Есть изменения</span> : null}</td><td>{item.kind === "story" ? "История" : "Tire IQ"}</td><td><span className={item.status === "on_site" ? styles.badgeOnSite : styles.badge}>{STATUS_LABEL[item.status]}</span></td><td><a className={styles.openLink} href={`/materials/${item.id}`} aria-label={`Открыть ${item.title}`}><Icon name="arrow" size={17} /></a></td></tr>
        ))}
      </tbody></table><div className={styles.tableFoot}>{items.length} материалов</div></div>}
    </main>
  );
}
