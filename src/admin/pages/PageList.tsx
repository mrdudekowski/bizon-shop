"use client";

import { useEffect, useState } from "react";

import { browserAdminClient } from "@/admin/client/localStore";
import type { DocumentStatus, EntityRecord, MediaListItem, PageDraft } from "@/admin/domain/types";

import { PAGE_LABELS } from "./pageLabels";
import styles from "@/admin/ui/catalog.module.css";
import { CatalogRow } from "@/admin/ui/CatalogRow";
import { AdminLoading } from "@/admin/ui/AdminLoading";
import { useAdminRole, useAdminSession } from "@/admin/ui/DocumentUI";
import { canEditorPerform } from "@/admin/domain/editorPermissions";
import { SectionAccessNotice } from "@/admin/ui/SectionAccessNotice";

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

function previewAssetId(draft: PageDraft): string | undefined {
  if (draft.id === "home") return draft.hero.image?.assetId ?? draft.shopCampaign.image?.assetId;
  if (draft.id === "shop-home") {
    return draft.hero.image?.assetId
      ?? draft.categoryCarousel.find((slide) => slide.desktopImage || slide.mobileImage)?.desktopImage?.assetId
      ?? draft.categoryCarousel.find((slide) => slide.mobileImage)?.mobileImage?.assetId
      ?? draft.vehicles.slides.find((slide) => slide.image)?.image?.assetId;
  }
  return draft.hero.image?.assetId;
}

export function PageList() {
  const session = useAdminSession();
  const [role] = useAdminRole();
  const [pages, setPages] = useState<EntityRecord<PageDraft>[]>([]);
  const [assets, setAssets] = useState<MediaListItem[]>([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <main>
      <div><h1>Страницы</h1><p className="subheading">Девять страниц сайта. Откройте страницу, чтобы изменить её содержимое.</p></div>
      {loading ? <AdminLoading label="Загружаем страницы…" /> : <ul className={styles.catalogList}>
        {pages.map((page) => (
          <li key={page.id}>
            <CatalogRow href={`/pages/${page.draft.id}`} title={PAGE_LABELS[page.draft.id]} icon="pages" imageUrl={assets.find((asset) => asset.id === previewAssetId(page.draft))?.dataUrl} status={statusOf(page)} hasUnpublishedDraft={hasDraft(page)} onStatusChange={role === "admin" ? (status) => changeStatus(page.draft.id, status) : undefined} />
          </li>
        ))}
      </ul>}
      <div className={styles.listFoot}>{pages.length} страниц · состав раздела фиксирован</div>
    </main>
  );
}
