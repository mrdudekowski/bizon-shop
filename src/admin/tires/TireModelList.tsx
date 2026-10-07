"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

import { browserAdminClient } from "@/admin/client/localStore";
import { sortModelsByPublicationStatus } from "@/admin/domain/catalogSort";
import { resolveSiteCatalogPreview } from "@/admin/domain/catalogPreviewUrl";
import { slugifyTitle } from "@/admin/domain/slug";
import type { DocumentStatus, TireDirection, TireModelListItem, MediaListItem } from "@/admin/domain/types";
import { Icon } from "@/admin/ui/Icon";
import { AdminLoading } from "@/admin/ui/AdminLoading";
import { CatalogRow } from "@/admin/ui/CatalogRow";
import { CatalogViewToggle } from "@/admin/ui/CatalogViewToggle";
import { useCatalogView } from "@/admin/ui/catalogView";
import { useAdminRole, useCanPerform } from "@/admin/ui/DocumentUI";
import styles from "@/admin/ui/catalog.module.css";

export function TireModelList() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedDirectionId = searchParams.get("direction") ?? "";
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [items, setItems] = useState<TireModelListItem[]>([]);
  const [directions, setDirections] = useState<TireDirection[]>([]);
  const [assets, setAssets] = useState<MediaListItem[]>([]);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"all" | DocumentStatus>("all");
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [role, setRole] = useAdminRole();
  const canCreate = useCanPerform("create_catalog_items");
  const [loading, setLoading] = useState(true);

  async function reload() {
    try {
      const client = browserAdminClient();
      const [models, dirs, media, session] = await Promise.all([client.listTireModels(), client.listTireDirections(), client.listAssets(), client.getSession()]);
      setAssets(media);
      setItems(models);
      setDirections(dirs);
      setRole(session.role);
    } finally {
      setLoading(false);
    }
  }

  async function deleteModel(id: string, status: DocumentStatus) {
    const client = browserAdminClient();
    try {
      if (status === "on_site") await client.hideTireModel(id);
      await client.deleteTireModel(id);
    } finally {
      await reload();
    }
  }

  useEffect(() => {
    void reload();
  }, []);

  async function changeModelStatus(id: string, nextStatus: DocumentStatus) {
    await browserAdminClient().changeDocumentStatus("tire-model", id, nextStatus);
    await reload();
  }

  const filteredModels = items.filter((item) => {
    const matchesName = item.name.toLocaleLowerCase("ru-RU").includes(query.trim().toLocaleLowerCase("ru-RU"));
    const matchesStatus = status === "all" || item.status === status;
    return matchesName && matchesStatus && item.directionId === selectedDirectionId;
  });
  const visible = status === "all" ? sortModelsByPublicationStatus(filteredModels) : filteredModels;
  const modelsInDirection = items.filter((item) => item.directionId === selectedDirectionId).length;
  const { view, setView } = useCatalogView("tire-models", modelsInDirection);

  function openCreate() {
    setName("");
    setSlug("");
    setSlugTouched(false);
    dialogRef.current?.showModal();
  }

  async function createModel() {
    if (!name.trim() || !selectedDirectionId) return;
    const client = browserAdminClient();
    const created = await client.createTireModel({ name, directionId: selectedDirectionId });
    const nextSlug = slugifyTitle(slugTouched ? slug : name);
    if (nextSlug && nextSlug !== created.draft.slug) {
      await client.saveTireModel(created.id, { ...created.draft, slug: nextSlug });
    }
    dialogRef.current?.close();
    router.push(`/tires/editor?id=${encodeURIComponent(created.id)}`);
  }

  return (
    <main>
      {!selectedDirectionId ? (
        <>
          <div className={styles.pageHead}>
            <div><h1>Шины</h1><p className="subheading">Сначала выберите направление, чтобы открыть каталог его моделей.</p></div>
            <Link className={styles.manageDirections} href="/tires/directions">Управление направлениями</Link>
          </div>
          {loading ? <AdminLoading label="Загружаем направления…" /> : <ul className={`${styles.grid} ${styles.directionPicker}`}>
            {directions.map((direction) => {
              const asset = assets.find((item) => item.id === direction.imageAssetId);
              const count = items.filter((item) => item.directionId === direction.id).length;
              return (
                <li key={direction.id}>
                  <article className={styles.directionChoice}>
                    <Link className={styles.card} href={`/?direction=${encodeURIComponent(direction.id)}`}>
                      <span className={styles.thumb}>{asset || resolveSiteCatalogPreview(direction.slug) ? <Image unoptimized width={52} height={56} src={asset?.dataUrl ?? resolveSiteCatalogPreview(direction.slug)!} alt="" /> : <Icon name="directions" size={34} />}</span>
                      <span className={styles.cardBody}><strong>{direction.name}</strong><span className={styles.meta}>{count} моделей</span></span>
                      <Icon name="arrow" size={16} />
                    </Link>
                    <Link className={styles.directionSettings} href={`/tires/directions/editor?id=${encodeURIComponent(direction.id)}`}>Настроить направление</Link>
                  </article>
                </li>
              );
            })}
          </ul>}
          {!loading && directions.length === 0 ? <div className={styles.empty}><Icon name="directions" size={36} /><h2>Направлений пока нет</h2><p>Создайте первое направление, чтобы начать собирать каталог шин.</p><Link className={styles.manageDirections} href="/tires/directions">Добавить направление</Link></div> : null}
        </>
      ) : (
        <>
      <div className={styles.pageHead}>
        <div><h1>{directions.find((direction) => direction.id === selectedDirectionId)?.name ?? "Шины"}</h1><p className="subheading">Модели шин, размеры и публикация на сайте.</p></div>
        <div className={styles.filterGroup}>
          {directions.some((direction) => direction.id === selectedDirectionId) ? <Link className={styles.manageDirections} href={`/tires/directions/editor?id=${encodeURIComponent(selectedDirectionId)}`}>Настроить направление</Link> : null}
          <button type="button" className="ghost" onClick={() => router.push("/")}>Все направления</button>
          {canCreate ? (
          <button type="button" className="primary" onClick={openCreate}>
            <Icon name="plus" /> Добавить модель
          </button>
          ) : null}
        </div>
      </div>
      <div className={styles.catalogControls}>
        <div className={styles.filters}>
          <label>
            Поиск
            <input type="search" placeholder="Поиск по названию модели…" value={query} onChange={(event) => setQuery(event.target.value)} />
          </label>
          <label>Статус<select value={status} onChange={(event) => setStatus(event.target.value as typeof status)}><option value="all">Все статусы</option><option value="draft">Черновик</option><option value="on_site">На сайте</option><option value="hidden">Скрыто</option></select></label>
        </div>
        <CatalogViewToggle view={view} onChange={setView} />
      </div>
      {loading ? <AdminLoading label="Загружаем модели шин…" /> : visible.length === 0 && !query.trim() && status === "all" ? (
        <div className={styles.empty}><Icon name="tires" size={36} /><h2>В этом направлении пока нет моделей</h2><p>Добавьте первую шину, чтобы собрать каталог направления.</p>{canCreate ? <button type="button" className="primary" onClick={openCreate}>Добавить модель</button> : null}</div>
      ) : visible.length === 0 ? (
        <p className={styles.empty}>Ничего не найдено</p>
      ) : (
        <>
          <ul className={view === "tiles" ? styles.catalogTiles : styles.catalogList}>
            {visible.map((item) => (
              <li key={item.id}>
                <CatalogRow view={view} href={`/tires/editor?id=${encodeURIComponent(item.id)}`} title={item.name} meta={`${item.sizeCount} размеров`} icon="tires" imageUrl={assets.find((asset) => asset.id === item.imageAssetId)?.dataUrl} status={item.status} hasUnpublishedDraft={item.hasUnpublishedDraft} onDelete={role === "admin" ? () => deleteModel(item.id, item.status) : undefined} onStatusChange={role === "admin" ? (nextStatus) => changeModelStatus(item.id, nextStatus) : undefined} />
              </li>
            ))}
          </ul>
          <div className={styles.listFoot}>Показано {visible.length} из {items.filter((item) => item.directionId === selectedDirectionId).length} моделей направления</div>
        </>
      )}
      <dialog ref={dialogRef} className={styles.dialog}>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void createModel();
          }}
        >
          <h2>Новая модель</h2>
          <label>
            Название
            <input
              value={name}
              onChange={(event) => {
                const next = event.target.value;
                setName(next);
                if (!slugTouched) setSlug(slugifyTitle(next));
              }}
            />
          </label>
          <label>
            Адрес
            <input
              value={slug}
              onChange={(event) => {
                setSlugTouched(true);
                setSlug(event.target.value);
              }}
            />
          <span className={styles.hint}>Адрес карточки на сайте. После публикации его нельзя изменить.</span>
          </label>
          <p className={styles.hint}>Направление: {directions.find((direction) => direction.id === selectedDirectionId)?.name}</p>
          <div className={styles.dialogActions}>
            <button type="button" className="ghost" onClick={() => dialogRef.current?.close()}>
              Отмена
            </button>
            <button className="primary" type="submit">
              Создать
            </button>
          </div>
        </form>
      </dialog>
        </>
      )}
    </main>
  );
}
