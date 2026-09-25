"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

import { browserAdminClient } from "@/admin/client/localStore";
import { slugifyTitle } from "@/admin/domain/slug";
import type { DocumentStatus, TireDirection, TireModelListItem, MediaListItem } from "@/admin/domain/types";
import { Icon } from "@/admin/ui/Icon";
import styles from "@/admin/ui/catalog.module.css";

const STATUS_LABEL: Record<DocumentStatus, string> = {
  draft: "черновик",
  on_site: "на сайте",
  hidden: "скрыто",
};

export function TireModelList() {
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [items, setItems] = useState<TireModelListItem[]>([]);
  const [directions, setDirections] = useState<TireDirection[]>([]);
  const [assets, setAssets] = useState<MediaListItem[]>([]);
  const [directionFilter, setDirectionFilter] = useState("");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"all" | DocumentStatus>("all");
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [directionId, setDirectionId] = useState("");

  async function reload() {
    const client = browserAdminClient();
    const [models, dirs, media] = await Promise.all([client.listTireModels(), client.listTireDirections(), client.listAssets()]);
    setAssets(media);
    setItems(models);
    setDirections(dirs);
    setDirectionId((current) => current || dirs[0]?.id || "");
  }

  useEffect(() => {
    void reload();
  }, []);

  const visible = items.filter((item) => {
    const matchesName = item.name.toLocaleLowerCase("ru-RU").includes(query.trim().toLocaleLowerCase("ru-RU"));
    const matchesStatus = status === "all" || item.status === status;
    return matchesName && matchesStatus && (!directionFilter || item.directionName === directionFilter);
  });

  function openCreate() {
    setName("");
    setSlug("");
    setSlugTouched(false);
    dialogRef.current?.showModal();
  }

  async function createModel() {
    if (!name.trim() || !directionId) return;
    const client = browserAdminClient();
    const created = await client.createTireModel({ name, directionId });
    const nextSlug = slugifyTitle(slugTouched ? slug : name);
    if (nextSlug && nextSlug !== created.draft.slug) {
      await client.saveTireModel(created.id, { ...created.draft, slug: nextSlug });
    }
    dialogRef.current?.close();
    router.push(`/tires/${created.id}`);
  }

  return (
    <main>
      <div className={styles.pageHead}>
        <div><h1>Шины</h1><p className="subheading">Модели шин, размеры и публикация на сайте.</p></div>
        <button className="primary" type="button" onClick={openCreate}>
          <Icon name="plus" /> Добавить модель
        </button>
      </div>
      <div className={styles.filters}>
        <label>
          Поиск
          <input type="search" placeholder="Поиск по названию модели…" value={query} onChange={(event) => setQuery(event.target.value)} />
        </label>
        <label>Направление<select value={directionFilter} onChange={(event) => setDirectionFilter(event.target.value)}><option value="">Все направления</option>{directions.map((direction) => <option key={direction.id} value={direction.name}>{direction.name}</option>)}</select></label>
        <label>Статус<select value={status} onChange={(event) => setStatus(event.target.value as typeof status)}><option value="all">Все статусы</option><option value="draft">Черновик</option><option value="on_site">На сайте</option><option value="hidden">Скрыто</option></select></label>
      </div>
      {items.length === 0 ? (
        <div className={styles.empty}><Icon name="tires" size={36} /><h2>Добавьте первую модель</h2><p>Укажите название и направление, затем заполните карточку шины.</p><button type="button" className="primary" onClick={openCreate}>Добавить модель</button></div>
      ) : visible.length === 0 ? (
        <p className={styles.empty}>Ничего не найдено</p>
      ) : (
        <div className={styles.tableWrap}><table className={styles.table}><thead><tr><th>Фото</th><th>Модель</th><th>Направление</th><th>Размеров</th><th>Статус</th><th><span className={styles.srOnly}>Открыть</span></th></tr></thead><tbody>
          {visible.map((item) => { const asset = assets.find((asset) => asset.id === item.imageAssetId); return <tr key={item.id}><td>{asset ? <Image unoptimized width={52} height={56} className={styles.thumb} src={asset.dataUrl} alt="" /> : <span className={styles.thumb}><Icon name="tires" size={28} /></span>}</td><td><a className={styles.nameLink} href={`/tires/${item.id}`}>{item.name}</a>{item.hasUnpublishedDraft ? <span className={styles.meta}>Есть неопубликованные изменения</span> : null}</td><td>{item.directionName}</td><td>{item.sizeCount}</td><td><span className={item.status === "on_site" ? styles.badgeOnSite : styles.badge}>{STATUS_LABEL[item.status]}</span></td><td><a className={styles.openLink} href={`/tires/${item.id}`} aria-label={`Открыть ${item.name}`}><Icon name="arrow" size={17} /></a></td></tr>; })}
        </tbody></table><div className={styles.tableFoot}>Показано {visible.length} из {items.length} моделей</div></div>
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
          <label>
            Направление
            <select value={directionId} onChange={(event) => setDirectionId(event.target.value)}>
              {directions.map((direction) => (
                <option key={direction.id} value={direction.id}>
                  {direction.name}
                </option>
              ))}
            </select>
          </label>
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
    </main>
  );
}
