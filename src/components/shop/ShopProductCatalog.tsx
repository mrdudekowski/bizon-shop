"use client";

import Link from "next/link";
import { useState } from "react";

import { PageHeader } from "@/components/catalog/PageHeader";
import { SiteArrow } from "@/components/SiteArrow/SiteArrow";
import { ShopProductCard } from "@/components/shop/ShopProductCard";
import type { CmsProduct, CmsShopCategory } from "@/lib/content/types";
import styles from "./ShopProductCatalog.module.css";

export function ShopProductCatalog({
  category,
  products,
}: {
  category: CmsShopCategory;
  products: CmsProduct[];
}) {
  const [subcategorySlug, setSubcategorySlug] = useState("");
  const subcategories = Array.from(
    new Map(products.flatMap((product) => product.subcategorySlug && product.subcategoryName
      ? [[product.subcategorySlug, product.subcategoryName] as const]
      : [])).entries(),
  ).sort((left, right) => left[1].localeCompare(right[1], "ru"));
  const visibleProducts = subcategorySlug
    ? products.filter((product) => product.subcategorySlug === subcategorySlug)
    : products;

  return (
    <div className={styles.page}>
      <PageHeader
        title={category.name}
        description={category.description}
        breadcrumbs={[
          { href: "/shop", label: "Shop" },
          { href: "/shop/categories", label: "Категории" },
          { href: `/shop/${category.slug}`, label: category.name },
        ]}
      />
      {subcategories.length > 0 ? (
        <label className={styles.filter}>
          Подкатегория
          <select value={subcategorySlug} onChange={(event) => setSubcategorySlug(event.target.value)}>
            <option value="">Все товары</option>
            {subcategories.map(([slug, name]) => <option key={slug} value={slug}>{name}</option>)}
          </select>
        </label>
      ) : null}
      {visibleProducts.length > 0 ? (
        <div className={styles.grid}>
          {visibleProducts.map((product) => <ShopProductCard key={product.slug} product={product} />)}
        </div>
      ) : (
        <section className={styles.empty}>
          <h2>{subcategorySlug ? "В этой подкатегории пока нет товаров" : "Коллекция готовится"}</h2>
          <p>{subcategorySlug ? "Выберите другую подкатегорию или покажите все товары." : "Товары и доступные варианты появятся после финального отбора."}</p>
          {subcategorySlug ? <button type="button" className={styles.resetFilter} onClick={() => setSubcategorySlug("")}>Показать все товары</button> : null}
        </section>
      )}
      <p className={styles.back}><Link href="/shop/categories"><SiteArrow direction="left" /> Все категории</Link></p>
    </div>
  );
}
