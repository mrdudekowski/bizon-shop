"use client";

import Link from "next/link";

import { CatalogImage } from "@/components/catalog/CatalogImage";
import { useCart } from "@/hooks/useCart";
import { cartItemKey, requestOpenCart } from "@/lib/cart/cartStorage";
import type { CmsProduct } from "@/lib/content/types";
import type { RequestItemInput } from "@/types/requestItem";
import styles from "./ShopProductCard.module.css";

function formatPrice(value: number): string {
  return `${value.toLocaleString("ru-RU")} ₽`;
}

export function ShopProductCard({ product }: { product: CmsProduct }) {
  const cart = useCart("shop");
  const hasVariants = product.variants.length > 0;
  const item: RequestItemInput = {
    itemType: "shopProduct",
    itemId: product.id ?? product.slug,
    name: product.name,
    slug: product.slug,
    parentSlug: product.categorySlug,
    quantity: 1,
    price: product.price,
    priceOnRequest: product.priceOnRequest,
    url: `/shop/product/${product.slug}`,
  };
  const inCart = !hasVariants && cart.items.some((cartItem) => cartItemKey(cartItem) === cartItemKey(item));
  const hasDiscount = product.price != null && product.oldPrice != null && product.oldPrice > product.price;

  function handleAdd() {
    if (inCart) {
      requestOpenCart("shop");
      return;
    }
    cart.addItem(item);
  }

  return (
    <article className={styles.card}>
      <Link className={styles.media} href={`/shop/product/${product.slug}`}>
        <CatalogImage
          src={product.imageUrl}
          alt={product.name}
          fallbackKey={product.slug}
          fill
          sizes="(max-width: 389px) 100vw, (max-width: 899px) 50vw, (max-width: 1279px) 33vw, 25vw"
        />
      </Link>
      <div className={styles.body}>
        <p>{product.categorySlug}</p>
        <h3><Link href={`/shop/product/${product.slug}`}>{product.name}</Link></h3>
        <p className={styles.description}>{product.descriptionShort}</p>
        <div className={styles.price}>
          {product.priceOnRequest || product.price == null ? (
            <strong>Цена по запросу</strong>
          ) : (
            <><strong>{formatPrice(product.price)}</strong>{hasDiscount && product.oldPrice != null ? <del>{formatPrice(product.oldPrice)}</del> : null}</>
          )}
        </div>
        {hasVariants ? (
          <Link className={styles.action} href={`/shop/product/${product.slug}`}>Выбрать варианты</Link>
        ) : (
          <button className={styles.action} type="button" disabled={!product.available} onClick={handleAdd}>
            {!product.available ? "Нет в наличии" : inCart ? "Перейти в корзину" : "Добавить в корзину"}
          </button>
        )}
      </div>
    </article>
  );
}
