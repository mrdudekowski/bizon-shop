"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { browserAdminClient } from "@/admin/client/localStore";
import { slugifyTitle } from "@/admin/domain/slug";
import type { DocumentStatus, MediaListItem } from "@/admin/domain/types";

import styles from "@/admin/ui/catalog.module.css";
import { Icon } from "@/admin/ui/Icon";
import { CatalogFilters } from "@/admin/ui/CatalogFilters";
import { CatalogRow } from "@/admin/ui/CatalogRow";
import { CatalogCreateDialog } from "@/admin/ui/CatalogCreateDialog";
import { AdminLoading } from "@/admin/ui/AdminLoading";
import { useAdminRole, useAdminSession, useCanPerform } from "@/admin/ui/DocumentUI";
import { canEditorPerform } from "@/admin/domain/editorPermissions";
import { SectionAccessNotice } from "@/admin/ui/SectionAccessNotice";

export function MaterialList() {
  const session = useAdminSession();
  const canCreate = useCanPerform("edit_site_pages");
  const router = useRouter();
  const [role] = useAdminRole();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [items, setItems] = useState<
    {
      id: string;
      title: string;
      kind: "article";
      imageAssetId: string | null;
      status: DocumentStatus;
      hasUnpublishedDraft: boolean;
    }[]
  >([]);
  const [assets, setAssets] = useState<MediaListItem[]>([]);
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"all" | DocumentStatus>("all");
  const [loading, setLoading] = useState(true);

  async function reload() {
    try {
      const client = browserAdminClient();
      const [materials, media] = await Promise.all([client.listMaterials(), client.listAssets()]);
      setItems(materials);
      setAssets(media);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void reload();
  }, []);

  async function changeStatus(id: string, nextStatus: DocumentStatus) {
    await browserAdminClient().changeDocumentStatus("material", id, nextStatus);
    await reload();
  }

  const visibleItems = items.filter((item) => {
    const matchesQuery = item.title.toLocaleLowerCase("ru-RU").includes(query.trim().toLocaleLowerCase("ru-RU"));
    const matchesStatus = status === "all" || item.status === status;
    return matchesQuery && matchesStatus;
  });

  function openCreate() {
    setTitle("");
    setSlug("");
    setSlugTouched(false);
    dialogRef.current?.showModal();
  }

  async function createMaterial() {
    if (!title.trim()) return;
    const client = browserAdminClient();
    const created = await client.createMaterial({ title, kind: "article" });
    const nextSlug = slugifyTitle(slugTouched ? slug : title);
    if (nextSlug && nextSlug !== created.draft.slug) await client.saveMaterial(created.id, { ...created.draft, slug: nextSlug });
    dialogRef.current?.close();
    router.push(`/materials/${created.id}`);
  }

  if (session == null) return <main><AdminLoading label="Проверяем доступ…" /></main>;
  if (!canEditorPerform(session, "edit_site_pages")) return <SectionAccessNotice title="Материалы" icon="materials" />;

  return (
    <main>
      <div className={styles.pageHead}><div><h1>Материалы</h1><p className="subheading">Экспертные статьи Tire IQ.</p></div>{canCreate ? <button className="primary" type="button" onClick={openCreate}>Добавить материал</button> : null}</div>
      <CatalogFilters query={query} onQueryChange={setQuery} status={status} onStatusChange={setStatus} placeholder="Название материала…" />
      {loading ? <AdminLoading label="Загружаем материалы…" /> : items.length === 0 ? <div className={styles.empty}><Icon name="materials" size={36} /><h2>Материалов пока нет</h2><p>Создайте статью Tire IQ.</p>{canCreate ? <button className="primary" type="button" onClick={openCreate}>Добавить материал</button> : null}</div> : visibleItems.length === 0 ? <div className={styles.empty}><h2>Ничего не найдено</h2><p>Измените запрос или выберите другой статус.</p></div> : <>
        <ul className={styles.catalogList}>{visibleItems.map((item) => (
          <li key={item.id}><CatalogRow href={`/materials/${item.id}`} title={item.title} meta="Tire IQ" icon="materials" imageUrl={assets.find((asset) => asset.id === item.imageAssetId)?.dataUrl} status={item.status} hasUnpublishedDraft={item.hasUnpublishedDraft} onStatusChange={role === "admin" ? (nextStatus) => changeStatus(item.id, nextStatus) : undefined} /></li>
        ))}</ul>
        <div className={styles.listFoot}>Показано {visibleItems.length} из {items.length} материалов</div>
      </>}
      <CatalogCreateDialog
        dialogRef={dialogRef}
        title="Новый материал"
        nameLabel="Название"
        name={title}
        slug={slug}
        onNameChange={(value) => { setTitle(value); if (!slugTouched) setSlug(slugifyTitle(value)); }}
        onSlugChange={(value) => { setSlugTouched(true); setSlug(value); }}
        onCancel={() => dialogRef.current?.close()}
        onSubmit={(event) => { event.preventDefault(); void createMaterial(); }}
      />
    </main>
  );
}
