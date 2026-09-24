"use client";

import { useEffect, useState } from "react";

import { browserAdminClient } from "@/admin/client/localStore";
import type { DocumentStatus, EntityRecord, PageDraft } from "@/admin/domain/types";

import { PAGE_LABELS } from "./pageLabels";
import styles from "./PageList.module.css";

function statusOf(record: EntityRecord<PageDraft>): DocumentStatus {
  if (record.hidden) return "hidden";
  if (record.publishedSnapshot == null) return "draft";
  return "on_site";
}

export function PageList() {
  const [pages, setPages] = useState<EntityRecord<PageDraft>[]>([]);

  useEffect(() => {
    void browserAdminClient().listPages().then(setPages);
  }, []);

  return (
    <main className={styles.list}>
      <h1>Страницы</h1>
      <ul>
        {pages.map((page) => (
          <li key={page.id}>
            <a href={`/pages/${page.draft.id}`}>{PAGE_LABELS[page.draft.id]}</a>
            <span>{statusOf(page)}</span>
          </li>
        ))}
      </ul>
    </main>
  );
}
