"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

import { marketplaceShown } from "@/components/catalog/marketplaceGallery";
import { LexicalContent } from "@/components/content/LexicalContent";
import { resolveCatalogImageSrc } from "@/constants/images";
import { useCart } from "@/hooks/useCart";
import { cartItemKey, requestOpenCart } from "@/lib/cart/cartStorage";
import type { CmsProduct, CmsProductVariant } from "@/lib/content/types";
import type { RequestItemInput } from "@/types/requestItem";
import styles from "./ShopProductConfigurator.module.css";

type OptionKey = "color" | "size" | "configuration";

const GROUPS: readonly { key: OptionKey; label: string }[] = [
  { key: "color", label: "Цвет" },
  { key: "size", label: "Размер" },
  { key: "configuration", label: "Комплектация" },
];

function unique(values: Array<string | undefined>): string[] {
  return Array.from(new Set(values.filter((value): value is string => Boolean(value))));
}

function formatPrice(value: number): string {
  return `${value.toLocaleString("ru-RU")} ₽`;
}

function variantLabel(variant: CmsProductVariant): string {
  return GROUPS
    .flatMap((group) => variant[group.key] ? [`${group.label}: ${variant[group.key]}`] : [])
    .join(" · ");
}

export function ShopProductConfigurator({ product }: { product: CmsProduct }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const cart = useCart("shop");
  const [pinned, setPinned] = useState(0);
  const [hovered, setHovered] = useState<number | null>(null);
  const [missingGroup, setMissingGroup] = useState<OptionKey | null>(null);
  const groupRefs = useRef<Partial<Record<OptionKey, HTMLFieldSetElement | null>>>({});

  const optionGroups = useMemo(
    () => GROUPS.map((group) => ({
      ...group,
      values: unique(product.variants.map((variant) => variant[group.key])),
    })).filter((group) => group.values.length > 0),
    [product.variants],
  );

  const selected = useMemo(() => {
    const result: Partial<Record<OptionKey, string>> = {};
    for (const group of optionGroups) {
      const value = searchParams.get(group.key);
      if (value && group.values.includes(value)) result[group.key] = value;
    }
    return result;
  }, [optionGroups, searchParams]);

  const selectedVariant = useMemo(() => {
    if (optionGroups.length === 0) return null;
    if (optionGroups.some((group) => !selected[group.key])) return null;
    return product.variants.find((variant) =>
      optionGroups.every((group) => variant[group.key] === selected[group.key])) ?? null;
  }, [optionGroups, product.variants, selected]);

  useEffect(() => {
    if (optionGroups.length === 0) return;

    const hasInvalidParam = optionGroups.some((group) => {
      const value = searchParams.get(group.key);
      return value !== null && !group.values.includes(value);
    });
    const hasCompleteQuery = optionGroups.every((group) => searchParams.has(group.key));
    if (!hasInvalidParam && (!hasCompleteQuery || selectedVariant)) return;

    const fallbackVariant = product.variants.find((variant) => variant.available);
    if (!fallbackVariant) return;

    const next = new URLSearchParams(searchParams.toString());
    for (const group of optionGroups) {
      const value = fallbackVariant[group.key];
      if (value) next.set(group.key, value);
      else next.delete(group.key);
    }
    router.replace(`${pathname}?${next.toString()}`, { scroll: false });
  }, [optionGroups, pathname, product.variants, router, searchParams, selectedVariant]);

  const baseImages = useMemo(
    () => unique([product.imageUrl ?? undefined, ...product.gallery]),
    [product.gallery, product.imageUrl],
  );
  const selectedColor = selected.color;
  const colorImages = useMemo(
    () => selectedColor
      ? unique(product.variants
          .filter((variant) => variant.color === selectedColor)
          .flatMap((variant) => variant.images))
      : [],
    [product.variants, selectedColor],
  );
  const gallery = colorImages.length > 0 ? colorImages : baseImages;
  const resolvedGallery = useMemo(
    () => gallery.length > 0
      ? gallery
      : [resolveCatalogImageSrc(product.imageUrl, product.slug)],
    [gallery, product.imageUrl, product.slug],
  );

  useEffect(() => {
    setPinned((current) => {
      if (resolvedGallery.length === 0) return 0;
      return Math.min(current, resolvedGallery.length - 1);
    });
    setHovered(null);
  }, [resolvedGallery]);
  const shown = marketplaceShown(pinned, hovered);
  const currentImage = resolvedGallery[shown] ?? resolvedGallery[0];
  const canSwitch = resolvedGallery.length > 1;
  function pin(index: number) {
    setPinned(index);
    setHovered(null);
  }

  const price = selectedVariant?.price ?? product.price;
  const oldPrice = selectedVariant?.oldPrice ?? product.oldPrice;
  const priceOnRequest = selectedVariant?.priceOnRequest ?? product.priceOnRequest;
  const discount = price != null && oldPrice != null && oldPrice > price
    ? Math.round((1 - price / oldPrice) * 100)
    : null;
  const available = product.available && (selectedVariant?.available ?? true);

  const item = useMemo<RequestItemInput>(() => {
    const label = selectedVariant ? variantLabel(selectedVariant) : undefined;
    return {
      itemType: "shopProduct",
      itemId: product.id ?? product.slug,
      variantId: selectedVariant?.id,
      name: product.name,
      slug: product.slug,
      parentSlug: product.categorySlug,
      quantity: 1,
      price,
      priceOnRequest,
      url: `${pathname}${searchParams.size ? `?${searchParams.toString()}` : ""}`,
      variantLabel: label,
    };
  }, [pathname, price, priceOnRequest, product, searchParams, selectedVariant]);
  const inCart = cart.items.some((cartItem) => cartItemKey(cartItem) === cartItemKey(item));

  function selectOption(key: OptionKey, value: string) {
    const next = new URLSearchParams(searchParams.toString());
    next.set(key, value);

    const matchingVariant = product.variants.find((variant) => {
      if (!variant.available || variant[key] !== value) return false;
      return optionGroups.every((group) => {
        if (group.key === key) return true;
        const selectedValue = next.get(group.key);
        return !selectedValue || variant[group.key] === selectedValue;
      });
    });
    if (!matchingVariant) {
      for (const group of optionGroups) {
        if (group.key !== key) next.delete(group.key);
      }
    }
    router.replace(`${pathname}?${next.toString()}`, { scroll: false });
    setMissingGroup(null);
  }

  function optionAvailable(key: OptionKey, value: string): boolean {
    return product.variants.some((variant) => variant.available && variant[key] === value);
  }

  function addToCart() {
    if (inCart) {
      requestOpenCart("shop");
      return;
    }

    const firstMissing = optionGroups.find((group) => !selected[group.key]);
    if (firstMissing) {
      setMissingGroup(firstMissing.key);
      groupRefs.current[firstMissing.key]?.focus();
      return;
    }
    if (!available || (optionGroups.length > 0 && !selectedVariant)) return;

    cart.addItem(item);
    requestOpenCart("shop");
  }

  return (
    <div className={styles.page}>
      <nav className={styles.breadcrumbs} aria-label="Хлебные крошки">
        <Link href="/shop">Shop</Link>
        <span aria-hidden="true">/</span>
        <Link href={`/shop/${product.categorySlug}`}>{product.categorySlug}</Link>
      </nav>

      <div className={styles.layout}>
        <section className={styles.gallery} aria-label={`Галерея ${product.name}`}>
          <button
            type="button"
            className={styles.mainImage}
            disabled={!canSwitch}
            onClick={() => pin(shown)}
            aria-label={canSwitch ? "Закрепить это фото" : product.name}
          >
            <Image
              src={currentImage}
              alt={product.name}
              fill
              priority
              sizes="(max-width: 900px) 100vw, 62vw"
            />
          </button>
          {canSwitch ? (
            <div
              className={styles.thumbnails} aria-label="Выбор изображения"
              onMouseLeave={() => setHovered(null)}
            >
              {resolvedGallery.map((image, index) => (
                <button
                  key={image}
                  type="button"
                  className={index === pinned ? styles.thumbnailActive : ""}
                  onMouseEnter={() => setHovered(index)}
                  onClick={() => pin(index)}
                  aria-label={`Показать изображение ${index + 1}`}
                  aria-pressed={index === pinned}
                >
                  <Image src={image} alt="" fill sizes="96px" />
                </button>
              ))}
            </div>
          ) : null}
        </section>

        <section className={styles.details} aria-labelledby="product-title">
          <p className={styles.kicker}>{product.categorySlug}</p>
          <h1 id="product-title">{product.name}</h1>
          <p className={styles.description}>{product.descriptionShort}</p>

          <div className={styles.price} aria-live="polite">
            {priceOnRequest || price == null ? (
              <strong>Цена по запросу</strong>
            ) : (
              <>
                <strong>{formatPrice(price)}</strong>
                {discount != null && oldPrice != null ? (
                  <><del>{formatPrice(oldPrice)}</del><span>−{discount}%</span></>
                ) : null}
              </>
            )}
          </div>

          {optionGroups.map((group) => (
            <fieldset
              key={group.key}
              ref={(node) => { groupRefs.current[group.key] = node; }}
              className={`${styles.optionGroup} ${missingGroup === group.key ? styles.optionGroupError : ""}`}
              tabIndex={-1}
            >
              <legend>{group.label}</legend>
              <div>
                {group.values.map((value) => {
                  const enabled = optionAvailable(group.key, value);
                  return (
                    <button
                      key={value}
                      type="button"
                      disabled={!enabled}
                      aria-pressed={selected[group.key] === value}
                      onClick={() => selectOption(group.key, value)}
                    >
                      {value}
                    </button>
                  );
                })}
              </div>
              {missingGroup === group.key ? <p role="alert">Выберите {group.label.toLowerCase()}</p> : null}
            </fieldset>
          ))}

          <p className={available ? styles.availability : styles.unavailable}>
            {available ? "Доступность подтверждается перед заказом" : "Сейчас недоступно"}
          </p>
          <button
            type="button"
            className={styles.addButton}
            onClick={addToCart}
            disabled={!available || (optionGroups.length > 0 && selectedVariant?.available === false)}
          >
            {inCart ? "Перейти в корзину" : "Добавить в корзину"}
          </button>
          <p className={styles.requestNote}>Добавление в корзину формирует заявку и не является оплатой.</p>
        </section>
      </div>

      <section className={styles.story} aria-labelledby="product-story-title">
        <p className={styles.kicker}>О товаре</p>
        <h2 id="product-story-title">{product.name}</h2>
        <LexicalContent data={product.descriptionLong} />
        {product.material ? <p>Материал: {product.material}</p> : null}
      </section>
    </div>
  );
}
