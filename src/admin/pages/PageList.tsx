"use client";

import { useEffect, useState } from "react";

import { browserAdminClient } from "@/admin/client/localStore";
import type { DocumentStatus, EntityRecord, PageDraft } from "@/admin/domain/types";

import { PAGE_LABELS } from "./pageLabels";
import styles from "@/admin/ui/catalog.module.css";
import { Icon } from "@/admin/ui/Icon";

const STATUS_LABEL: Record<DocumentStatus, string> = {
  draft: "черновик",
  on_site: "на сайте",
  hidden: "скрыто",
};

function statusOf(record: EntityRecord<PageDraft>): DocumentStatus {
  if (record.hidden) return "hidden";
  if (record.publishedSnapshot == null) return "draft";
  return "on_site";
}

function hasDraft(record: EntityRecord<PageDraft>): boolean {
  return (
    record.publishedSnapshot != null &&
    record.savedDraft != null &&
    JSON.stringify(record.savedDraft) !== JSON.stringify(record.publishedSnapshot)
  );
}

export function PageList() {
  const [pages, setPages] = useState<EntityRecord<PageDraft>[]>([]);

  useEffect(() => {
    void browserAdminClient().listPages().then(setPages);
  }, []);

  return (
    <main>
      <div><h1>Страницы</h1><p className="subheading">Девять страниц сайта. Откройте страницу, чтобы изменить её содержимое.</p></div>
      <div className={styles.tableWrap}><table className={styles.table}><thead><tr><th>Страница</th><th>Статус публикации</th><th>Черновик</th><th><span className={styles.srOnly}>Открыть</span></th></tr></thead><tbody>
        {pages.map((page) => (
          <tr key={page.id}><td><a className={styles.nameLink} href={`/pages/${page.draft.id}`}>{PAGE_LABELS[page.draft.id]}</a></td><td><span className={statusOf(page) === "on_site" ? styles.badgeOnSite : styles.badge}>{STATUS_LABEL[statusOf(page)]}</span></td><td><span className={styles.meta}>{hasDraft(page) ? "Есть изменения" : "—"}</span></td><td><a className={styles.openLink} href={`/pages/${page.draft.id}`} aria-label={`Открыть ${PAGE_LABELS[page.draft.id]}`}><Icon name="arrow" size={17} /></a></td></tr>
        ))}
      </tbody></table><div className={styles.tableFoot}>{pages.length} страниц · состав раздела фиксирован</div></div>
    </main>
  );
}
