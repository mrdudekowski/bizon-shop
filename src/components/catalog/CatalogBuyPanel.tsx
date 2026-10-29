"use client";

import { useMemo, useState } from "react";

import { AddToCartButton } from "@/components/cart/AddToCartButton";
import type { RequestItemInput } from "@/types/requestItem";

import styles from "./CatalogBuyPanel.module.css";

export type CatalogBuyVariant = {
  id: string;
  label: string;
  price?: number;
  priceOnRequest?: boolean;
  available?: boolean;
};

type CatalogBuyPanelProps = {
  baseItem: RequestItemInput;
  variants: CatalogBuyVariant[];
  available?: boolean;
  sizeLabel?: string;
  emptyVariantsMessage?: string;
  priceNotice?: string;
  className?: string;
};

function formatPrice(variant: CatalogBuyVariant | null): string {
  if (!variant) return "—";
  if (variant.priceOnRequest || variant.price == null) return "По запросу";
  return `${variant.price.toLocaleString("ru-RU")} ₽`;
}

export function CatalogBuyPanel({
  baseItem,
  variants,
  available,
  sizeLabel = "Размер",
  emptyVariantsMessage = "Размеры уточняются — можно добавить модель без размера или связаться со специалистом.",
  priceNotice,
  className,
}: CatalogBuyPanelProps) {
  const [variantId, setVariantId] = useState(
    variants.length === 1 ? variants[0].id : "",
  );
  const [quantity, setQuantity] = useState(1);

  const selected = useMemo(
    () => variants.find((variant) => variant.id === variantId) ?? null,
    [variantId, variants],
  );

  const needsSize = variants.length > 0;
  const canAdd = !needsSize || Boolean(selected);

  const item: RequestItemInput = {
    ...baseItem,
    quantity,
    variantId: selected?.id,
    variantLabel: selected?.label,
    price: selected?.price,
    priceOnRequest:
      selected == null
        ? baseItem.priceOnRequest ?? true
        : selected.priceOnRequest || selected.price == null,
  };

  return (
    <div className={`${styles.panel} ${className ?? ""}`}>
      {variants.length > 0 ? (
        <label className={styles.field}>
          <span className={styles.label}>{sizeLabel}</span>
          <select
            className={styles.select}
            value={variantId}
            onChange={(event) => setVariantId(event.target.value)}
          >
            <option value="">Выберите размер</option>
            {variants.map((variant) => (
              <option key={variant.id} value={variant.id}>
                {variant.label}
              </option>
            ))}
          </select>
        </label>
      ) : (
        <p className={styles.hint}>{emptyVariantsMessage}</p>
      )}

      <div className={styles.metaRow}>
        <div className={styles.priceBlock}>
          <span className={styles.label}>Стоимость</span>
          <strong className={styles.price}>{formatPrice(selected)}</strong>
        </div>
        <label className={styles.qtyField}>
          <span className={styles.label}>Количество</span>
          <span className={styles.qtyControls}>
            <button
              type="button"
              className={styles.qtyBtn}
              aria-label="Уменьшить количество"
              disabled={quantity <= 1}
              onClick={() => setQuantity((value) => Math.max(1, value - 1))}
            >
              −
            </button>
            <input
              className={styles.qtyInput}
              type="number"
              min={1}
              max={999}
              value={quantity}
              onChange={(event) => {
                const next = Number(event.target.value);
                if (!Number.isFinite(next)) return;
                setQuantity(Math.min(999, Math.max(1, Math.round(next))));
              }}
            />
            <button
              type="button"
              className={styles.qtyBtn}
              aria-label="Увеличить количество"
              onClick={() => setQuantity((value) => Math.min(999, value + 1))}
            >
              +
            </button>
          </span>
        </label>
      </div>

      <div className={`${styles.actions} action-row`}>
        {canAdd ? (
          <AddToCartButton
            cartKind="bizon"
            item={item}
            label="Добавить в корзину"
            className="btn-accent"
          />
        ) : (
          <button type="button" className="btn-accent" disabled>
            Добавить в корзину
          </button>
        )}
        <span
          className="availability-badge"
          data-status={(available ?? selected?.available ?? true) ? "in-stock" : "on-order"}
        >
          {(available ?? selected?.available ?? true) ? "В наличии" : "Под заказ"}
        </span>
      </div>
      {!canAdd && (
        <p className={styles.hint}>Сначала выберите размер</p>
      )}
      {priceNotice?.trim() ? (
        <p className={styles.notice} data-price-notice="">{priceNotice}</p>
      ) : null}
    </div>
  );
}
