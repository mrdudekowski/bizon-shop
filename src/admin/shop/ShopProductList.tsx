"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { browserAdminClient } from "@/admin/client/localStore";
import type { DocumentStatus, EntityRecord, ShopCategoryDraft } from "@/admin/domain/types";

import styles from "./ShopDocument.module.css";

const STATUS_LABEL: Record<DocumentStatus, string> = {
  draft: "черновик",
  on_site: "на сайте",
  hidden: "скрыто",
};

export function ShopProductList() {
  const router = useRouter();
  const [categories, setCategories] = useState<EntityRecord<ShopCategoryDraft>[]>([]);
  const [products, setProducts] = useState<
    { id: string; name: string; categoryName: string; status: DocumentStatus }[]
  >([]);
  const [categoryName, setCategoryName] = useState("");
  const [name, setName] = useState("");
  const [categoryId, setCategoryId] = useState("");

  async function reload() {
    const client = browserAdminClient();
    const [nextCategories, nextProducts] = await Promise.all([
      client.listShopCategories(),
      client.listShopProducts(),
    ]);
    setCategories(nextCategories);
    setProducts(nextProducts);
    setCategoryId((current) => current || nextCategories[0]?.id || "");
  }

  useEffect(() => {
    void reload();
  }, []);

  return (
    <main className={styles.page}>
      <h1>Shop</h1>
      <form
        className={styles.section}
        onSubmit={(event) => {
          event.preventDefault();
          if (!categoryName.trim()) return;
          void browserAdminClient()
            .createShopCategory({ name: categoryName })
            .then((created) => router.push(`/shop/categories/${created.id}`));
        }}
      >
        <label className={styles.field}>
          Новая категория
          <input
            aria-label="Новая категория"
            value={categoryName}
            onChange={(event) => setCategoryName(event.target.value)}
          />
        </label>
        <button type="submit">Новая категория</button>
      </form>
      <ul className={styles.section}>
        {categories.map((category) => (
          <li key={category.id}>
            <a href={`/shop/categories/${category.id}`}>{category.draft.name}</a>{" "}
            <span>{category.draft.slug}</span>
          </li>
        ))}
      </ul>
      <form
        className={styles.section}
        onSubmit={(event) => {
          event.preventDefault();
          if (!name.trim() || !categoryId) return;
          void browserAdminClient()
            .createShopProduct({ name, categoryId })
            .then((created) => router.push(`/shop/${created.id}`));
        }}
      >
        <label className={styles.field}>
          Название товара
          <input
            aria-label="Название товара"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        </label>
        <label className={styles.field}>
          Категория
          <select
            aria-label="Категория"
            value={categoryId}
            onChange={(event) => setCategoryId(event.target.value)}
          >
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.draft.name}
              </option>
            ))}
          </select>
        </label>
        <button type="submit">Новый товар</button>
      </form>
      <ul className={styles.section}>
        {products.map((product) => (
          <li key={product.id}>
            <a href={`/shop/${product.id}`}>{product.name}</a>
            <span> {product.categoryName} </span>
            <span>{STATUS_LABEL[product.status]}</span>
          </li>
        ))}
      </ul>
    </main>
  );
}
