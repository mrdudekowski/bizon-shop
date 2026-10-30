"use client";

import { useEffect, useState } from "react";

import { browserAdminClient } from "@/admin/client/localStore";
import type { DocumentStatus, EntityRecord, MediaListItem, PageDraft } from "@/admin/domain/types";

import { PAGE_LABELS } from "./pageLabels";
import styles from "@/admin/ui/catalog.module.css";
import { CatalogRow } from "@/admin/ui/CatalogRow";
import { CatalogViewToggle } from "@/admin/ui/CatalogViewToggle";
import { useCatalogView } from "@/admin/ui/catalogView";
import { AdminLoading } from "@/admin/ui/AdminLoading";
import { useAdminRole, useAdminSession } from "@/admin/ui/DocumentUI";
import { canEditorPerform } from "@/admin/domain/editorPermissions";
import { SectionAccessNotice } from "@/admin/ui/SectionAccessNotice";
import { previewAssetId } from "./pagePreview";
import { pageListSurface, type PageListSurface } from "./textPageDraft";

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
  const session = useAdminSession();
  const [role] = useAdminRole();
  const [pages, setPages] = useState<EntityRecord<PageDraft>[]>([]);
  const [assets, setAssets] = useState<MediaListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { view, setView } = useCatalogView("pages", pages.length);
  const [surface, setSurface] = useState<PageListSurface>("tires");

  async function reload() {
    const client = browserAdminClient();
    const [nextPages, media] = await Promise.all([client.listPages(), client.listAssets()]);
    setPages(nextPages);
    setAssets(media);
    setLoading(false);
  }

  useEffect(() => {
    void reload();
  }, []);

  async function changeStatus(id: string, status: DocumentStatus) {
    await browserAdminClient().changeDocumentStatus("page", id, status);
    await reload();
  }

  if (session == null) return <main><AdminLoading label="Проверяем доступ…" /></main>;
  if (!canEditorPerform(session, "edit_site_pages")) return <SectionAccessNotice title="Страницы" icon="pages" />;

  const listed = pages.filter((page) => pageListSurface(page.draft.id) != null);

  return (
    <main>
      <div className={styles.pageHead}>
        <div><h1>Страницы</h1><p className="subheading">Откройте страницу, чтобы изменить её содержимое.</p></div>
        <CatalogViewToggle view={view} onChange={setView} />
      </div>
      <div className={styles.pageTabs} role="tablist" aria-label="Разделы страниц">
        <button type="button" className={styles.pageTab} role="tab" aria-selected={surface === "shared"} onClick={() => setSurface("shared")}>Общие</button>
        <button type="button" className={styles.pageTab} role="tab" aria-selected={surface === "tires"} onClick={() => setSurface("tires")}>BIZON TIRES</button>
        <button type="button" className={styles.pageTab} role="tab" aria-selected={surface === "shop"} onClick={() => setSurface("shop")}>BIZON SHOP</button>
      </div>
      {loading ? <AdminLoading label="Загружаем страницы…" /> : <ul className={view === "tiles" ? styles.catalogTiles : styles.catalogList}>
        {listed.filter((page) => pageListSurface(page.draft.id) === surface).map((page) => (
          <li key={page.id}>
            <CatalogRow view={view} href={`/pages/editor?key=${encodeURIComponent(page.draft.id)}`} title={PAGE_LABELS[page.draft.id]} icon="pages" imageUrl={assets.find((asset) => asset.id === previewAssetId(page.draft))?.dataUrl} status={statusOf(page)} hasUnpublishedDraft={hasDraft(page)} onStatusChange={role === "admin" ? (status) => changeStatus(page.draft.id, status) : undefined} />
          </li>
        ))}
      </ul>}
      <div className={styles.listFoot}>{listed.length} страниц · состав раздела фиксирован</div>
    </main>
  );
}
