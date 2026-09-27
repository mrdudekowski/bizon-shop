"use client";

import { useEffect, useState } from "react";

import { browserAdminClient } from "@/admin/client/localStore";
import type { DocumentStatus, EntityRecord, PageDraft } from "@/admin/domain/types";

import { PAGE_LABELS } from "./pageLabels";
import styles from "@/admin/ui/catalog.module.css";
import { CatalogRow } from "@/admin/ui/CatalogRow";
import { AdminLoading } from "@/admin/ui/AdminLoading";
import { useAdminRole } from "@/admin/ui/DocumentUI";

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
  const [role] = useAdminRole();
  const [pages, setPages] = useState<EntityRecord<PageDraft>[]>([]);
  const [loading, setLoading] = useState(true);

  async function reload() {
    setPages(await browserAdminClient().listPages());
    setLoading(false);
  }

  useEffect(() => {
    void reload();
  }, []);

  async function changeStatus(id: string, status: DocumentStatus) {
    await browserAdminClient().changeDocumentStatus("page", id, status);
    await reload();
  }

  return (
    <main>
      <div><h1>Страницы</h1><p className="subheading">Девять страниц сайта. Откройте страницу, чтобы изменить её содержимое.</p></div>
      {loading ? <AdminLoading label="Загружаем страницы…" /> : <ul className={styles.catalogList}>
        {pages.map((page) => (
          <li key={page.id}>
            <CatalogRow href={`/pages/${page.draft.id}`} title={PAGE_LABELS[page.draft.id]} icon="pages" status={statusOf(page)} hasUnpublishedDraft={hasDraft(page)} onStatusChange={role === "admin" ? (status) => changeStatus(page.draft.id, status) : undefined} />
          </li>
        ))}
      </ul>}
      <div className={styles.listFoot}>{pages.length} страниц · состав раздела фиксирован</div>
    </main>
  );
}
