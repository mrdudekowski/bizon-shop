"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

import { browserAdminClient } from "@/admin/client/localStore";
import type { DocumentStatus, EntityRecord, ShopCategoryDraft } from "@/admin/domain/types";
import { Icon } from "@/admin/ui/Icon";

import styles from "@/admin/ui/catalog.module.css";

const STATUS_LABEL: Record<DocumentStatus, string> = {
  draft: "черновик",
  on_site: "на сайте",
  hidden: "скрыто",
};

export function ShopProductList() {
  const router = useRouter();
  const [categories, setCategories] = useState<EntityRecord<ShopCategoryDraft>[]>([]);
  const [products, setProducts] = useState<
    {
      id: string;
      name: string;
      categoryName: string;
      categoryId: string;
      status: DocumentStatus;
      hasUnpublishedDraft: boolean;
    }[]
  >([]);
  const [categoryName, setCategoryName] = useState("");
  const [name, setName] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [assets, setAssets] = useState<{ id: string; dataUrl: string }[]>([]);

  async function reload() {
    const client = browserAdminClient();
    const [nextCategories, nextProducts] = await Promise.all([
      client.listShopCategories(),
      client.listShopProducts(),
    ]);
    setAssets(await client.listAssets());
    setCategories(nextCategories);
    setProducts(nextProducts);
    setCategoryId((current) => current || nextCategories[0]?.id || "");
    setSelectedCategoryId((current) => current || nextCategories[0]?.id || "");
  }

  useEffect(() => {
    void reload();
  }, []);

  return (
    <main>
      <div><h1>Shop</h1><p className="subheading">Категории каталога и товары с ценами и вариантами.</p></div>
      <form
        className={styles.createForm}
        onSubmit={(event) => {
          event.preventDefault();
          if (!categoryName.trim()) return;
          void browserAdminClient()
            .createShopCategory({ name: categoryName })
            .then((created) => router.push(`/shop/categories/${created.id}`));
        }}
      >
        <label>
          Новая категория
          <input
            aria-label="Новая категория"
            value={categoryName}
            onChange={(event) => setCategoryName(event.target.value)}
          />
        </label>
        <button className="primary" type="submit">Добавить категорию</button>
      </form>
      <ul className={styles.grid}>
        {categories.map((category) => (
          <li key={category.id}>
            <div className={styles.card}><span className={styles.thumb}>{category.draft.mainImage && assets.find((asset) => asset.id === category.draft.mainImage?.assetId) ? <Image unoptimized width={90} height={100} src={assets.find((asset) => asset.id === category.draft.mainImage?.assetId)!.dataUrl} alt=""/> : <Icon name="shop" size={34}/>}</span><span className={styles.cardBody}><button type="button" className="ghost" aria-pressed={selectedCategoryId === category.id} onClick={() => { setSelectedCategoryId(category.id); setCategoryId(category.id); }}>{category.draft.name}</button><span className={styles.meta}>/{category.draft.slug}</span><span className={category.hidden ? styles.badge : styles.badgeOnSite}>{STATUS_LABEL[category.hidden ? "hidden" : category.publishedSnapshot == null ? "draft" : "on_site"]}</span><a href={`/shop/categories/${category.id}`} aria-label={`Настроить ${category.draft.name}`}>Настроить <Icon name="arrow" size={14}/></a></span></div>
          </li>
        ))}
      </ul>
      {selectedCategoryId ? <form
        className={styles.createForm}
        onSubmit={(event) => {
          event.preventDefault();
          if (!name.trim() || !categoryId) return;
          void browserAdminClient()
            .createShopProduct({ name, categoryId })
            .then((created) => router.push(`/shop/${created.id}`));
        }}
      >
        <label>
          Название товара
          <input
            aria-label="Название товара"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        </label>
        <span className={styles.meta}>Категория: {categories.find((category) => category.id === selectedCategoryId)?.draft.name}</span>
        <button className="primary" type="submit">Добавить товар</button>
      </form> : null}
      {selectedCategoryId ? <div className={styles.tableWrap}><table className={styles.table}><thead><tr><th>Товар</th><th>Категория</th><th>Статус</th><th>Черновик</th><th></th></tr></thead><tbody>{products.filter((product) => product.categoryId === selectedCategoryId).map((product) => <tr key={product.id}><td><a className={styles.nameLink} href={`/shop/${product.id}`}>{product.name}</a></td><td>{product.categoryName}</td><td><span className={product.status === "on_site" ? styles.badgeOnSite : styles.badge}>{STATUS_LABEL[product.status]}</span></td><td>{product.hasUnpublishedDraft ? "Есть изменения" : "—"}</td><td><a className={styles.openLink} href={`/shop/${product.id}`} aria-label={`Открыть ${product.name}`}><Icon name="arrow" size={17}/></a></td></tr>)}</tbody></table><div className={styles.tableFoot}>{products.filter((product) => product.categoryId === selectedCategoryId).length} товаров</div></div> : null}
    </main>
  );
}
