"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { browserAdminClient } from "@/admin/client/localStore";
import { sortModelsByPublicationStatus } from "@/admin/domain/catalogSort";
import { hydrateMissingImageAssetIds } from "@/admin/domain/hydrateWheelPreviewAssets";
import { slugifyTitle } from "@/admin/domain/slug";
import type { DocumentStatus, EntityRecord, MediaListItem, WheelTypeDraft } from "@/admin/domain/types";
import { CatalogFilters } from "@/admin/ui/CatalogFilters";
import { CatalogRow } from "@/admin/ui/CatalogRow";
import { CatalogViewToggle } from "@/admin/ui/CatalogViewToggle";
import { useCatalogView } from "@/admin/ui/catalogView";
import { CatalogCreateDialog } from "@/admin/ui/CatalogCreateDialog";
import { useAdminRole, useCanPerform } from "@/admin/ui/DocumentUI";

import styles from "@/admin/ui/catalog.module.css";

export function WheelModelList() {
  const router = useRouter();
  const modelDialogRef = useRef<HTMLDialogElement>(null);
  const [types, setTypes] = useState<EntityRecord<WheelTypeDraft>[]>([]);
  const [assets, setAssets] = useState<MediaListItem[]>([]);
  const [models, setModels] = useState<
    { id: string; name: string; typeName: string; wheelTypeId: string; imageAssetId: string | null; status: DocumentStatus; hasUnpublishedDraft: boolean }[]
  >([]);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"all" | DocumentStatus>("all");
  const [role, setRole] = useAdminRole();
  const canCreate = useCanPerform("create_catalog_items");

  async function reload() {
    const client = browserAdminClient();
    const [nextTypes, listedModels, nextAssets, session] = await Promise.all([client.listWheelTypes(), client.listWheelModels(), client.listAssets(), client.getSession()]);
    const nextModels = await hydrateMissingImageAssetIds(listedModels, async (id) => client.getWheelModel(id));
    setTypes(nextTypes);
    setModels(nextModels);
    setAssets(nextAssets);
    setRole(session.role);
  }

  const defaultTypeId = types.find((type) => type.draft.slug === "forged")?.id ?? types[0]?.id ?? "";

  async function deleteModel(id: string, status: DocumentStatus) {
    const client = browserAdminClient();
    try {
      if (status === "on_site") await client.hideWheelModel(id);
      await client.deleteWheelModel(id);
    } finally {
      await reload();
    }
  }

  useEffect(() => {
    void reload();
  }, []);

  async function changeModelStatus(id: string, nextStatus: DocumentStatus) {
    await browserAdminClient().changeDocumentStatus("wheel-model", id, nextStatus);
    await reload();
  }

  const matchingModels = models.filter((model) => {
    const matchesQuery = model.name.toLocaleLowerCase("ru-RU").includes(query.trim().toLocaleLowerCase("ru-RU"));
    const matchesStatus = status === "all" || model.status === status;
    return matchesQuery && matchesStatus;
  });
  const filteredModels = status === "all" ? sortModelsByPublicationStatus(matchingModels) : matchingModels;
  const { view, setView } = useCatalogView("wheel-models", models.length);

  function openModelDialog() {
    setName("");
    setSlug("");
    setSlugTouched(false);
    modelDialogRef.current?.showModal();
  }

  async function createModel() {
    if (!name.trim()) return;
    const client = browserAdminClient();
    let wheelTypeId = defaultTypeId;
    if (!wheelTypeId) {
      const internalType = await client.createWheelType({ name: "Кованые диски" });
      const savedType = internalType.draft.slug === "forged"
        ? internalType
        : await client.saveWheelType(internalType.id, { ...internalType.draft, slug: "forged" });
      wheelTypeId = savedType.id;
    }
    const created = await client.createWheelModel({ name, wheelTypeId });
    const nextSlug = slugifyTitle(slugTouched ? slug : name);
    if (nextSlug && nextSlug !== created.draft.slug) await client.saveWheelModel(created.id, { ...created.draft, slug: nextSlug });
    modelDialogRef.current?.close();
    router.push(`/wheels/editor?id=${encodeURIComponent(created.id)}`);
  }

  return (
    <main>
      <div className={styles.pageHead}><div><h1>Диски</h1><p className="subheading">Модели кованых дисков, размеры и публикация на сайте.</p></div></div>
      <div className={styles.pageHead}><h2>Модели дисков</h2>{canCreate ? <button className="primary" type="button" onClick={openModelDialog}>Добавить модель</button> : null}</div>
      <div className={styles.catalogControls}>
        <CatalogFilters query={query} onQueryChange={setQuery} status={status} onStatusChange={setStatus} placeholder="Название модели…" />
        <CatalogViewToggle view={view} onChange={setView} />
      </div>
      {filteredModels.length === 0 ? <p className={styles.empty}>{models.length > 0 ? "По заданным фильтрам модели не найдены" : "Моделей дисков пока нет"}</p> : <>
        <ul className={view === "tiles" ? styles.catalogTiles : styles.catalogList}>{filteredModels.map((model) => <li key={model.id}><CatalogRow view={view} href={`/wheels/editor?id=${encodeURIComponent(model.id)}`} title={model.name} icon="wheels" imageUrl={assets.find((asset) => asset.id === model.imageAssetId)?.dataUrl} status={model.status} hasUnpublishedDraft={model.hasUnpublishedDraft} onDelete={role === "admin" ? () => deleteModel(model.id, model.status) : undefined} onStatusChange={role === "admin" ? (nextStatus) => changeModelStatus(model.id, nextStatus) : undefined} /></li>)}</ul>
        <div className={styles.listFoot}>Показано {filteredModels.length} моделей</div>
      </>}
      <CatalogCreateDialog
        dialogRef={modelDialogRef}
        title="Новая модель диска"
        nameLabel="Название модели"
        name={name}
        slug={slug}
        context="Все диски в этом каталоге — кованые."
        onNameChange={(value) => { setName(value); if (!slugTouched) setSlug(slugifyTitle(value)); }}
        onSlugChange={(value) => { setSlugTouched(true); setSlug(value); }}
        onCancel={() => modelDialogRef.current?.close()}
        onSubmit={(event) => { event.preventDefault(); void createModel(); }}
      />
    </main>
  );
}
