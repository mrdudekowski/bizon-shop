"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { browserAdminClient } from "@/admin/client/localStore";
import { slugifyTitle } from "@/admin/domain/slug";
import type { DocumentStatus, TireDirection, MediaListItem } from "@/admin/domain/types";
import { CatalogFilters } from "@/admin/ui/CatalogFilters";
import { CatalogCreateDialog } from "@/admin/ui/CatalogCreateDialog";
import { CatalogRow } from "@/admin/ui/CatalogRow";
import { AdminLoading } from "@/admin/ui/AdminLoading";
import { useAdminRole } from "@/admin/ui/DocumentUI";
import styles from "@/admin/ui/catalog.module.css";

export function TireDirectionList() {
  const router = useRouter();
  const [role] = useAdminRole();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [directions, setDirections] = useState<TireDirection[]>([]);
  const [assets, setAssets] = useState<MediaListItem[]>([]);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"all" | DocumentStatus>("all");
  const [loading, setLoading] = useState(true);

  async function reload() {
    try {
      const client = browserAdminClient();
      const [items, media] = await Promise.all([client.listTireDirections(), client.listAssets()]);
      setDirections(items);
      setAssets(media);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void reload();
  }, []);

  async function changeDirectionStatus(id: string, nextStatus: DocumentStatus) {
    await browserAdminClient().changeDocumentStatus("tire-direction", id, nextStatus);
    await reload();
  }

  function openCreate() {
    setName("");
    setSlug("");
    setSlugTouched(false);
    dialogRef.current?.showModal();
  }

  async function createDirection() {
    if (!name.trim()) return;
    const created = await browserAdminClient().createTireDirection({ name });
    const nextSlug = slugifyTitle(slugTouched ? slug : name);
    if (nextSlug && nextSlug !== created.draft.slug) {
      await browserAdminClient().saveTireDirection(created.id, { ...created.draft, slug: nextSlug });
    }
    dialogRef.current?.close();
    router.push(`/tires/directions/${created.id}`);
  }

  const visibleDirections = directions.filter((direction) => {
    const matchesQuery = direction.name.toLocaleLowerCase("ru-RU").includes(query.trim().toLocaleLowerCase("ru-RU"));
    const matchesStatus = status === "all" || direction.status === status;
    return matchesQuery && matchesStatus;
  });

  return (
    <main>
      <div className={styles.pageHead}><div><h1>Направления</h1><p className="subheading">Техника, дороги и условия работы для подбора шин.</p></div><button className="primary" type="button" onClick={openCreate}>Добавить направление</button></div>
      <CatalogFilters query={query} onQueryChange={setQuery} status={status} onStatusChange={setStatus} placeholder="Название направления…" />
      {loading ? <AdminLoading label="Загружаем направления…" /> : <ul className={styles.catalogList}>
        {visibleDirections.map((direction) => (
          <li key={direction.id}>
            <CatalogRow href={`/tires/directions/${direction.id}`} title={direction.name} meta={`/${direction.slug}`} icon="directions" imageUrl={assets.find((asset) => asset.id === direction.imageAssetId)?.dataUrl} status={direction.status} hasUnpublishedDraft={direction.hasUnpublishedDraft} onStatusChange={role === "admin" ? (nextStatus) => changeDirectionStatus(direction.id, nextStatus) : undefined} />
          </li>
        ))}
      </ul>}
      {!loading && visibleDirections.length === 0 ? <div className={styles.empty}><h2>{directions.length === 0 ? "Направлений пока нет" : "Ничего не найдено"}</h2><p>{directions.length === 0 ? "Создайте направление, чтобы начать собирать каталог шин." : "Измените запрос или выберите другой статус."}</p>{directions.length === 0 ? <button className="primary" type="button" onClick={openCreate}>Добавить направление</button> : null}</div> : null}
      <CatalogCreateDialog
        dialogRef={dialogRef}
        title="Новое направление"
        nameLabel="Название направления"
        name={name}
        slug={slug}
        namePlaceholder="Например, Магистральные"
        onNameChange={(value) => { setName(value); if (!slugTouched) setSlug(slugifyTitle(value)); }}
        onSlugChange={(value) => { setSlugTouched(true); setSlug(value); }}
        onCancel={() => dialogRef.current?.close()}
        onSubmit={(event) => { event.preventDefault(); void createDirection(); }}
      />
    </main>
  );
}
