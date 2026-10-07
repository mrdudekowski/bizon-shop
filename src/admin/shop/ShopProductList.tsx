"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { browserAdminClient } from "@/admin/client/localStore";
import { slugifyTitle } from "@/admin/domain/slug";
import type { EntityRecord, ShopCategoryDraft } from "@/admin/domain/types";
import { Icon } from "@/admin/ui/Icon";
import { CatalogRow } from "@/admin/ui/CatalogRow";
import { CatalogViewToggle } from "@/admin/ui/CatalogViewToggle";
import { useCatalogView } from "@/admin/ui/catalogView";
import { CatalogCreateDialog } from "@/admin/ui/CatalogCreateDialog";
import { AdminLoading } from "@/admin/ui/AdminLoading";
import { useAdminRole, useCanPerform } from "@/admin/ui/DocumentUI";

import styles from "@/admin/ui/catalog.module.css";

export function ShopProductList() {
  const router = useRouter();
  const [role] = useAdminRole();
  const canCreate = useCanPerform("create_catalog_structure");
  const categoryDialogRef = useRef<HTMLDialogElement>(null);
  const [categories, setCategories] = useState<EntityRecord<ShopCategoryDraft>[]>([]);
  const [productCounts, setProductCounts] = useState<Record<string, number>>({});
  const [categoryName, setCategoryName] = useState("");
  const [categorySlug, setCategorySlug] = useState("");
  const [categorySlugTouched, setCategorySlugTouched] = useState(false);
  const [assets, setAssets] = useState<{ id: string; dataUrl: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { view, setView } = useCatalogView("shop-categories", categories.length);

  async function reload() {
    setError("");
    try {
      const client = browserAdminClient();
      const [nextCategories, nextProducts, nextAssets] = await Promise.all([
        client.listShopCategories(),
        client.listShopProducts(),
        client.listAssets(),
      ]);
      const counts = nextProducts.reduce<Record<string, number>>((total, product) => {
        total[product.categoryId] = (total[product.categoryId] ?? 0) + 1;
        return total;
      }, {});
      setCategories(nextCategories);
      setProductCounts(counts);
      setAssets(nextAssets);
    } catch {
      setError("Не удалось загрузить категории. Проверьте соединение и попробуйте ещё раз.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void reload();
  }, []);

  async function changeCategoryStatus(id: string, status: "draft" | "on_site" | "hidden") {
    await browserAdminClient().changeDocumentStatus("shop-category", id, status);
    await reload();
  }

  function openCategoryDialog() {
    setCategoryName("");
    setCategorySlug("");
    setCategorySlugTouched(false);
    categoryDialogRef.current?.showModal();
  }

  async function createCategory() {
    if (!categoryName.trim()) return;
    const client = browserAdminClient();
    const created = await client.createShopCategory({ name: categoryName.trim() });
    const nextSlug = slugifyTitle(categorySlugTouched ? categorySlug : categoryName);
    if (nextSlug && nextSlug !== created.draft.slug) {
      await client.saveShopCategory(created.id, { ...created.draft, slug: nextSlug });
    }
    categoryDialogRef.current?.close();
    router.push(`/shop/category-editor?id=${encodeURIComponent(created.id)}`);
  }

  function imageUrl(category: EntityRecord<ShopCategoryDraft>) {
    const assetId = category.draft.mainImage?.assetId;
    return assets.find((asset) => asset.id === assetId)?.dataUrl ?? null;
  }

  function tileImageUrl(category: EntityRecord<ShopCategoryDraft>) {
    const assetId = category.draft.carousel.find((slide) => slide.image?.assetId)?.image?.assetId
      ?? category.draft.mainImage?.assetId;
    return assets.find((asset) => asset.id === assetId)?.dataUrl ?? null;
  }

  return (
    <main>
      <div className={styles.pageHead}>
        <div>
          <h1>Shop</h1>
          <p className="subheading">Категории каталога и товары с ценами и вариантами.</p>
        </div>
        <div className={styles.filterGroup}>
          <CatalogViewToggle view={view} onChange={setView} />
          {canCreate ? <button className="primary" type="button" onClick={openCategoryDialog}>Добавить категорию</button> : null}
        </div>
      </div>

      {loading ? <AdminLoading label="Загружаем категории…" /> : null}
      {error ? <p role="alert">{error}</p> : null}

      {!loading && !error && categories.length === 0 ? (
        <div className={styles.empty}>
          <Icon name="shop" size={36} />
          <h2>Категорий пока нет</h2>
          <p>Создайте категорию каталога. Товары добавляются внутри неё, когда будут готовы их характеристики.</p>
          {canCreate ? <button className="primary" type="button" onClick={openCategoryDialog}>Добавить категорию</button> : null}
        </div>
      ) : null}

      {!loading && !error && categories.length > 0 ? (
        <ul className={view === "tiles" ? styles.catalogTiles : styles.catalogList} aria-label="Категории Shop">
          {categories.map((category) => (
            <li key={category.id}>
              <CatalogRow
                view={view}
                href={`/shop/category-editor?id=${encodeURIComponent(category.id)}`}
                title={category.draft.name || "Без названия"}
                meta={`/${category.draft.slug} · ${productCounts[category.id] ?? 0} товаров`}
                icon="shop"
                imageUrl={imageUrl(category)}
                tileImageUrl={tileImageUrl(category)}
                imageOnWhiteBackground
                largeShopCategory
                status={category.hidden ? "hidden" : category.publishedSnapshot == null ? "draft" : "on_site"}
                onStatusChange={role === "admin" ? (status) => changeCategoryStatus(category.id, status) : undefined}
              />
            </li>
          ))}
        </ul>
      ) : null}

      <CatalogCreateDialog
        dialogRef={categoryDialogRef}
        title="Новая категория"
        nameLabel="Название категории"
        name={categoryName}
        slug={categorySlug}
        onNameChange={(value) => {
          setCategoryName(value);
          if (!categorySlugTouched) setCategorySlug(slugifyTitle(value));
        }}
        onSlugChange={(value) => {
          setCategorySlugTouched(true);
          setCategorySlug(value);
        }}
        onCancel={() => categoryDialogRef.current?.close()}
        onSubmit={(event) => {
          event.preventDefault();
          void createCategory().catch(() => setError("Не удалось создать категорию. Проверьте название и адрес страницы."));
        }}
      />
    </main>
  );
}
