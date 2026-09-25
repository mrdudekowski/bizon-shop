"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

import { browserAdminClient } from "@/admin/client/localStore";
import type { DocumentStatus, EntityRecord, WheelTypeDraft } from "@/admin/domain/types";
import { Icon } from "@/admin/ui/Icon";

import styles from "@/admin/ui/catalog.module.css";

const STATUS_LABEL: Record<DocumentStatus, string> = {
  draft: "черновик",
  on_site: "на сайте",
  hidden: "скрыто",
};

export function WheelModelList() {
  const router = useRouter();
  const [types, setTypes] = useState<EntityRecord<WheelTypeDraft>[]>([]);
  const [models, setModels] = useState<
    { id: string; name: string; typeName: string; wheelTypeId: string; status: DocumentStatus; hasUnpublishedDraft: boolean }[]
  >([]);
  const [name, setName] = useState("");
  const [wheelTypeId, setWheelTypeId] = useState("");
  const [selectedTypeId, setSelectedTypeId] = useState("");
  const [typeName, setTypeName] = useState("");
  const [assets, setAssets] = useState<{ id: string; dataUrl: string }[]>([]);

  async function reload() {
    const client = browserAdminClient();
    const [nextTypes, nextModels] = await Promise.all([client.listWheelTypes(), client.listWheelModels()]);
    setAssets(await client.listAssets());
    setTypes(nextTypes);
    setModels(nextModels);
    setWheelTypeId((current) => current || nextTypes[0]?.id || "");
    setSelectedTypeId((current) => current || nextTypes[0]?.id || "");
  }

  useEffect(() => {
    void reload();
  }, []);

  return (
    <main>
      <div><h1>Диски</h1><p className="subheading">Сначала выберите тип диска, чтобы открыть модели этого типа.</p></div>
      <form
        className={styles.createForm}
        onSubmit={(event) => {
          event.preventDefault();
          if (!typeName.trim()) return;
          void browserAdminClient()
            .createWheelType({ name: typeName })
            .then((created) => router.push(`/wheels/types/${created.id}`));
        }}
      >
        <label>
          Новый тип диска
          <input
            aria-label="Новый тип диска"
            value={typeName}
            onChange={(event) => setTypeName(event.target.value)}
          />
        </label>
        <button className="primary" type="submit">Добавить тип</button>
      </form>
      <ul className={styles.grid}>
        {types.map((type) => (
          <li key={type.id}>
            <div className={styles.card}><span className={styles.thumb}>{type.draft.mainImage && assets.find((asset) => asset.id === type.draft.mainImage?.assetId) ? <Image unoptimized width={90} height={100} src={assets.find((asset) => asset.id === type.draft.mainImage?.assetId)!.dataUrl} alt=""/> : <Icon name="wheels" size={34}/>}</span><span className={styles.cardBody}><button className="ghost" type="button" aria-pressed={selectedTypeId === type.id} onClick={() => { setSelectedTypeId(type.id); setWheelTypeId(type.id); }}>{type.draft.name}</button><span className={styles.meta}>/{type.draft.slug}</span><span className={type.hidden ? styles.badge : styles.badgeOnSite}>{STATUS_LABEL[type.hidden ? "hidden" : type.publishedSnapshot == null ? "draft" : "on_site"]}</span><a href={`/wheels/types/${type.id}`} aria-label={`Настроить ${type.draft.name}`}>Настроить <Icon name="arrow" size={14}/></a></span></div>
          </li>
        ))}
      </ul>
      {selectedTypeId ? <form
        className={styles.createForm}
        onSubmit={(event) => {
          event.preventDefault();
          if (!name.trim() || !wheelTypeId) return;
          void browserAdminClient()
            .createWheelModel({ name, wheelTypeId })
            .then((created) => router.push(`/wheels/${created.id}`));
        }}
      >
        <label>
          Название модели диска
          <input
            aria-label="Название модели диска"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        </label>
        <span className={styles.meta}>Тип: {types.find((type) => type.id === selectedTypeId)?.draft.name}</span>
        <button className="primary" type="submit">Добавить модель</button>
      </form> : null}
      {selectedTypeId ? <div className={styles.tableWrap}><table className={styles.table}><thead><tr><th>Модель</th><th>Тип диска</th><th>Статус</th><th>Черновик</th><th></th></tr></thead><tbody>{models.filter((model) => model.wheelTypeId === selectedTypeId).map((model) => <tr key={model.id}><td><a className={styles.nameLink} href={`/wheels/${model.id}`}>{model.name}</a></td><td>{model.typeName}</td><td><span className={model.status === "on_site" ? styles.badgeOnSite : styles.badge}>{STATUS_LABEL[model.status]}</span></td><td>{model.hasUnpublishedDraft ? "Есть изменения" : "—"}</td><td><a className={styles.openLink} href={`/wheels/${model.id}`} aria-label={`Открыть ${model.name}`}><Icon name="arrow" size={17}/></a></td></tr>)}</tbody></table><div className={styles.tableFoot}>{models.filter((model) => model.wheelTypeId === selectedTypeId).length} моделей</div></div> : null}
    </main>
  );
}
