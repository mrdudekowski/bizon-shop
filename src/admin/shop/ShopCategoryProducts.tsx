"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { browserAdminClient } from "@/admin/client/localStore";
import { AdminClientError } from "@/admin/client/errors";
import { slugifyTitle } from "@/admin/domain/slug";
import type { DocumentStatus, ShopSubcategoryDraft } from "@/admin/domain/types";
import { useAdminRole } from "@/admin/ui/DocumentUI";
import { AdminLoading } from "@/admin/ui/AdminLoading";
import { CatalogCreateDialog } from "@/admin/ui/CatalogCreateDialog";
import { CatalogFilters } from "@/admin/ui/CatalogFilters";
import { CatalogRow } from "@/admin/ui/CatalogRow";
import styles from "@/admin/ui/catalog.module.css";

type ShopProductListItem = {
  id: string;
  name: string;
  categoryName: string;
  categoryId: string;
  categoryPublished: boolean;
  isPublished: boolean;
  subcategoryId?: string;
  status: DocumentStatus;
  hasUnpublishedDraft: boolean;
};

export function ShopCategoryProducts({ categoryId, categoryName }: { categoryId: string; categoryName: string }) {
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [products, setProducts] = useState<ShopProductListItem[]>([]);
  const [subcategories, setSubcategories] = useState<ShopSubcategoryDraft[]>([]);
  const [role, setRole] = useAdminRole();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"all" | DocumentStatus>("all");
  const [subcategoryId, setSubcategoryId] = useState("");
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const reload = useCallback(async () => {
    setError("");
    try {
      const client = browserAdminClient();
      const [allProducts, options, session] = await Promise.all([
        client.listShopProducts(),
        client.listShopSubcategories(categoryId),
        client.getSession(),
      ]);
      setProducts(allProducts.filter((product) => product.categoryId === categoryId));
      setSubcategories(options);
      setRole(session.role);
    } catch {
      setError("Не удалось загрузить товары этой категории. Проверьте соединение и попробуйте ещё раз.");
    } finally {
      setLoading(false);
    }
  }, [categoryId, setRole]);

  useEffect(() => {
    setLoading(true);
    setSubcategoryId("");
    void reload();
  }, [categoryId, reload]);

  function openCreateDialog() {
    setName("");
    setSlug("");
    setSlugTouched(false);
    dialogRef.current?.showModal();
  }

  async function createProduct() {
    if (!name.trim()) return;
    const client = browserAdminClient();
    const created = await client.createShopProduct({ name: name.trim(), categoryId });
    const nextSlug = slugifyTitle(slugTouched ? slug : name);
    if (nextSlug && nextSlug !== created.draft.slug) {
      await client.saveShopProduct(created.id, { ...created.draft, slug: nextSlug });
    }
    dialogRef.current?.close();
    router.push(`/shop/${created.id}`);
  }

  async function changeStatus(id: string, nextStatus: DocumentStatus) {
    try {
      await browserAdminClient().changeDocumentStatus("shop-product", id, nextStatus);
      await reload();
    } catch (error) {
      setError(
        error instanceof AdminClientError && error.code === "category_not_published"
          ? "Сначала опубликуйте категорию, затем можно разместить товар на сайте."
          : "Не удалось изменить статус товара. Проверьте категорию и попробуйте ещё раз.",
      );
    }
  }

  async function deleteProduct(product: ShopProductListItem) {
    const client = browserAdminClient();
    if (product.isPublished) await client.hideShopProduct(product.id);
    await client.deleteShopProduct(product.id);
    await reload();
  }

  const visibleProducts = products.filter((product) => {
    const matchesName = product.name.toLocaleLowerCase("ru-RU").includes(query.trim().toLocaleLowerCase("ru-RU"));
    const matchesSubcategory = !subcategoryId || product.subcategoryId === subcategoryId;
    return matchesName && matchesSubcategory && (status === "all" || product.status === status);
  });

  return (
    <section aria-labelledby="shop-category-products-title">
      <div className={styles.pageHead}>
        <div>
          <h2 id="shop-category-products-title">Товары</h2>
          <p className="subheading">{products.length} {products.length === 1 ? "товар" : "товаров"} в категории «{categoryName}»</p>
        </div>
        <button className="primary" type="button" onClick={openCreateDialog}>Добавить товар</button>
      </div>

      <CatalogFilters
        query={query}
        onQueryChange={setQuery}
        status={status}
        onStatusChange={setStatus}
        placeholder="Название товара…"
        subcategoryId={subcategoryId}
        subcategories={subcategories}
        onSubcategoryChange={setSubcategoryId}
      />

      {error ? <p role="alert">{error}</p> : null}
      {loading ? <AdminLoading label="Загружаем товары…" /> : null}
      {!loading && !error && products.length === 0 ? (
        <div className={styles.empty}>
          <h3>В этой категории пока нет товаров</h3>
          <p>Добавьте карточку сейчас или вернитесь позже, когда будут готовы её характеристики.</p>
          <button className="primary" type="button" onClick={openCreateDialog}>Добавить товар</button>
        </div>
      ) : null}
      {!loading && !error && products.length > 0 && visibleProducts.length === 0 ? (
        <div className={styles.empty}>
          <h3>Подходящих товаров нет</h3>
          <p>Измените поисковый запрос или выберите другой статус.</p>
          <button className="ghost" type="button" onClick={() => { setQuery(""); setStatus("all"); setSubcategoryId(""); }}>Сбросить фильтры</button>
        </div>
      ) : null}
      {!loading && visibleProducts.length > 0 ? (
        <>
          <ul className={styles.catalogList} aria-label={`Товары категории ${categoryName}`}>
            {visibleProducts.map((product) => (
              <li key={product.id}>
                <CatalogRow
                  href={`/shop/${product.id}`}
                  title={product.name || "Без названия"}
                  meta={`${categoryName}${!product.categoryPublished ? " · доступность ждёт публикации категории" : ""}`}
                  icon="shop"
                  status={product.status}
                  hasUnpublishedDraft={product.hasUnpublishedDraft}
                  onDelete={role === "admin" ? () => deleteProduct(product) : undefined}
                  onStatusChange={role === "admin" ? (nextStatus) => changeStatus(product.id, nextStatus) : undefined}
                />
              </li>
            ))}
          </ul>
          <p className={styles.listFoot}>Показано {visibleProducts.length} из {products.length} товаров</p>
        </>
      ) : null}

      <CatalogCreateDialog
        dialogRef={dialogRef}
        title="Новый товар"
        nameLabel="Название товара"
        name={name}
        slug={slug}
        context={`Категория: ${categoryName}`}
        onNameChange={(value) => {
          setName(value);
          if (!slugTouched) setSlug(slugifyTitle(value));
        }}
        onSlugChange={(value) => {
          setSlugTouched(true);
          setSlug(value);
        }}
        onCancel={() => dialogRef.current?.close()}
        onSubmit={(event) => {
          event.preventDefault();
          void createProduct().catch(() => setError("Не удалось создать товар. Проверьте название и адрес страницы."));
        }}
      />
    </section>
  );
}
