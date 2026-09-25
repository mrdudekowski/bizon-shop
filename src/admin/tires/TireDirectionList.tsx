"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

import { browserAdminClient } from "@/admin/client/localStore";
import type { DocumentStatus, TireDirection, MediaListItem } from "@/admin/domain/types";
import { Icon } from "@/admin/ui/Icon";
import styles from "@/admin/ui/catalog.module.css";

const STATUS_LABEL: Record<DocumentStatus, string> = {
  draft: "черновик",
  on_site: "на сайте",
  hidden: "скрыто",
};

export function TireDirectionList() {
  const router = useRouter();
  const [directions, setDirections] = useState<TireDirection[]>([]);
  const [assets, setAssets] = useState<MediaListItem[]>([]);
  const [name, setName] = useState("");

  async function reload() {
    const client = browserAdminClient();
    const [items, media] = await Promise.all([client.listTireDirections(), client.listAssets()]);
    setDirections(items);
    setAssets(media);
  }

  useEffect(() => {
    void reload();
  }, []);

  async function createDirection() {
    if (!name.trim()) return;
    const created = await browserAdminClient().createTireDirection({ name });
    router.push(`/tires/directions/${created.id}`);
  }

  return (
    <main>
      <div><h1>Направления</h1><p className="subheading">Техника, дороги и условия работы для подбора шин.</p></div>
      <form
        className={styles.createForm}
        onSubmit={(event) => {
          event.preventDefault();
          void createDirection();
        }}
      >
        <label>Название направления<input
          aria-label="Название нового направления"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Например, Магистральные"
        /></label>
        <button className="primary" type="submit">Добавить направление</button>
      </form>
      <ul className={styles.grid}>
        {directions.map((direction) => (
          <li key={direction.id}>
            <a className={styles.card} href={`/tires/directions/${direction.id}`}><span className={styles.thumb}>{assets.find((asset) => asset.id === direction.imageAssetId) ? <Image unoptimized width={52} height={56} src={assets.find((asset) => asset.id === direction.imageAssetId)!.dataUrl} alt="" /> : <Icon name="directions" size={34} />}</span><span className={styles.cardBody}><strong>{direction.name}</strong><span className={styles.meta}>/{direction.slug}</span><span className={styles.badges}><span className={direction.status === "on_site" ? styles.badgeOnSite : styles.badge}>{STATUS_LABEL[direction.status]}</span>{direction.hasUnpublishedDraft ? <span className={styles.badge}>есть черновик</span> : null}</span></span><Icon name="arrow" size={16} /></a>
          </li>
        ))}
      </ul>
    </main>
  );
}
